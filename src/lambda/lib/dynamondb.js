/**
 * dynamodb lib
 */

import AWS from 'aws-sdk'
import _ from 'lodash'
import {
  tables,
  debug,
  dynamodbDefinitions
} from './common'

AWS.config.update({
  region: process.env.DYNAMODB_REGION
})

const prefix = process.env.DYNAMODB_TABLE_PREFIX || 'ringcentral_ai_bot'

const dynamodb = new AWS.DynamoDB()

function createTableName(table) {
  return prefix + '_' + table
}

function tableExist() {
  return new Promise((resolve) => {
    let params = {
      TableName: createTableName(tables[0])
    }
    dynamodb.describeTable(params, function (err) {
      if (err) {
        return resolve(false)
      }
      resolve(true)
    })
  })
}

function createTable(table) {
  return new Promise((resolve, reject) => {
    let defs = dynamodbDefinitions[table]
    let params = Object.keys(defs).reduce(
      (prev, key) => {
        let v = defs[key]
        prev.AttributeDefinitions.push({
          AttributeName: key,
          AttributeType: v[0]
        })
        prev.KeySchema.push({
          AttributeName: key,
          KeyType: v[1]
        })
        return prev
      },
      {
        AttributeDefinitions: [],
        KeySchema: [],
        TableName: createTableName(table),
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    )
    dynamodb.createTable(params, function(err, data) {
      if (err) {
        debug(err, 'create table error')
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

async function createTableWrap(table) {
  await createTable(table)
  return new Promise((resolve, reject) => {
    var params = {
      TableName: createTableName(table)
    }
    dynamodb.waitFor(
      'tableExists',
      params,
      function(err, data) {
        if (err) {
          debug(err, 'wait for db tableExists error', table)
          return reject(err)
        }
        resolve(data)
      }
    )
  })
}

async function prepareDb() {
  let exist = await tableExist()
  if (exist) {
    return true
  }
  for (let t of tables) {
    await createTableWrap(t)
  }
}

function formatItem(item, table) {
  return Object.keys(item)
    .reduce((prev, key) => {
      let type = _.get(
        dynamodbDefinitions,
        `${table}.${key}[1]`
      )
      let v = _.get(item, `${key}.S`)
      if (!type) {
        v = JSON.parse(v)
      }
      return {
        ...prev,
        [key]: v
      }
    }, {})
}

function putItem(item, table) {
  return new Promise((resolve, reject) => {
    let Item = Object.keys(item).reduce(
      (prev, key) => {
        let type = _.get(
          dynamodbDefinitions,
          `${table}.${key}[2]`
        )
        let v = item[key]
        return {
          ...prev,
          [key]: {
            S: type === 'string'
              ? v
              : JSON.stringify(v)
          }
        }
      },
      {}
    )
    let params = {
      TableName: createTableName(table),
      Item
    }
    dynamodb.putItem(params, function (err) {
      if (err) {
        debug('put item error', err.stack)
        return reject(err)
      }
      resolve(true)
    })
  })
}

function removeItem(id, table) {
  return new Promise((resolve) => {
    let params = {
      TableName: createTableName(table),
      Key: {
        id: {
          S: id
        }
      }
    }
    dynamodb.deleteItem(params, function (err) {
      if (err) {
        debug(err, 'delete item error')
        return resolve(false)
      }
      resolve(true)
    })
  })
}

function getItem(id, table) {
  return new Promise((resolve) => {
    let params = {
      TableName: createTableName(table),
      Key: {
        id: {
          S: id
        }
      }
    }
    dynamodb.getItem(params, function (err, data) {
      if (err) {
        debug(err, 'get item error')
        return resolve(false)
      }
      if (!data.Item) {
        return resolve(false)
      }
      let res = formatItem(data.Item, table)
      resolve(res)
    })
  })
}

function scan(table) {
  return new Promise((resolve) => {
    let params = {
      TableName: createTableName(table)
    }
    dynamodb.scan(params, function (err, data) {
      if (err) {
        debug(err, 'get item error')
        return resolve(false)
      }
      if (!data.Items) {
        return resolve(false)
      }
      let res = data.Items.map(item => formatItem(item, table))
      resolve(res)
    })
  })
}

/**
 * db action
 * @param {String} tableName
 * @param {String} action, add, remove, update, get
 * @param {Object} data
 * for add, {id: xxx, token: {...}, groups: {...}}
 * for remove, {id: xxx} or {ids: [...]}
 * for update, {id: xxx, update: {...}}
 * for get, singleUser:{id: xxx}, allUser: undefined
 */
export async function dbAction(tableName, action, data) {
  debug(
    'db action',
    tableName,
    action
    //data
  )
  await prepareDb()
  let {id = '', update} = data
  switch(action) {
    case 'add':
      await putItem(data, tableName)
      break
    case 'remove':
      if (!id) {
        break
      }
      if (id) {
        removeItem(id, tableName)
      }
      break
    case 'update':
      if (!id) {
        break
      }
      var old = await getItem(id, tableName)
      if (old) {
        Object.assign(old, update)
        await putItem(old, tableName)
      }
      break
    case 'get':
      if (id) {
        return getItem(id, tableName)
      }
      return scan(tableName)
    default:
      break
  }
}

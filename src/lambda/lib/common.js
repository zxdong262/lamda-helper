/**
 * sync message related
 */
import _ from 'lodash'

const env = process.env.NODE_ENV

export function log(...args) {
  console.log(
    '' + new Date().toISOString(),
    ...args
  )
}

export function debug(...args) {
  if (env !== 'production') {
    console.log(
      '' + new Date(),
      ...args
    )
  }
}

/**
 * response helper
 */
export function result (
  msg,
  status = 200,
  options = {}
) {
  return {
    statusCode: status,
    body: msg,
    ...options
  }
}

/**
 * handle event not userful
 */
export function handleEvent (evt) {
  return {
    statusCode: 200,
    body: JSON.stringify(evt)
  }
}

export const tables = [
  'job'
]

export const dynamodbDefinitions = {
  job: {
    id: ['S', 'HASH', 'string']
  }
}

export function handleRCError(type, e) {
  log(
    type,
    'error',
    _.get(e, 'response.data') || e.stack
  )
}

/**
 * wait async
 */
export function delay(time) {
  return new Promise(resolve => {
    setTimeout(resolve, time)
  })
}

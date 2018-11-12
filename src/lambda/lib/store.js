/**
 * db wrapper
 */

import db from './db'
import generate from 'shortid'

export function save(eventBody) {
  return db.dbAction(
    'job',
    'add',
    {
      id: generate(),
      eventBody
    }
  )
}

export function list() {
  return db.dbAction(
    'job',
    'get',
    {}
  )
}

export function remove(id) {
  return db.dbAction(
    'job',
    'remove',
    {id}
  )
}


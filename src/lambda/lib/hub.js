/**
 * check event type, send event to different event handler
 */

import task from './task'
import _ from 'lodash'
import {handleEvent, debug} from './common'

const mapper = {
  task
}

export default event => {
  debug('----------event get--------------')
  debug(event)
  debug('-----------event get-------------')
  let { action = 'alien' } = event.pathParameters || {}
  let handler = mapper[action] || handleEvent
  event.body = event.body || {}
  if (_.isString(event.body)) {
    event.body = JSON.parse(event.body)
  }
  event.queryStringParameters = event.queryStringParameters || {}
  return handler(event)
}

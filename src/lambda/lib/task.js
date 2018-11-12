/**
 * task hanlder
 * handle /task request
 */

import {
  result
} from './common'
import {request} from './request'
import {save} from './store'

export default async (event) => {
  let eventBody = event.body || {}
  let {
    url,
    scheduledTime = 0
  } = eventBody
  if (!url) {
    return result('url required', 400)
  }
  if (!scheduledTime) {
    await request(eventBody)
    return result('ok')
  }
  await save(eventBody)
  return result('ok')
}

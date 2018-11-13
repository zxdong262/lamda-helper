/**
 * task hanlder
 * handle /task request
 */

import {
  result, delay
} from './common'
import {request} from './request'
import {save} from './store'
import selfTrigger from './self-trigger'

export default async (event) => {
  console.log(event, 'evnet in task')
  let eventBody = event.body || {}
  let {
    url,
    scheduledTime = 0,
    wait = 0
  } = eventBody
  if (!url) {
    return result('url required', 400)
  }
  if (!scheduledTime) {
    await request(eventBody)
    return result('ok')
  } else if (wait) {
    await delay(wait)
    await request(eventBody)
    return result('ok')
  }
  await save(eventBody)
  event.body.wait = 30000
  await selfTrigger(event)
  return result('ok')
}

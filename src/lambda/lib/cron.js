/**
 * cron job triggered by serverless cron setting
 */

import {list, remove} from './store'
import {request} from './request'
import {debug, delay} from './common'
import _ from 'lodash'

export default async function (event) {
  debug('----get event=-----')
  debug(event)
  debug('----get event end=-----')
  let wait = _.get(event, 'body.wait')
  if (wait) {
    console.log('wait', wait)
    await delay(wait)
  }
  let jobs = await list()
  for (let job of jobs) {
    let {id, eventBody} = job
    await request(eventBody)
    await remove(id)
  }
  return 'ok'
}

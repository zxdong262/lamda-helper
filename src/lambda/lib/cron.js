/**
 * cron job triggered by serverless cron setting
 */

import {list, remove} from './store'
import {request} from './request'
import {debug} from './common'

export default async function (event) {
  debug('----get event=-----')
  debug(event)
  debug('----get event end=-----')
  let jobs = await list()
  for (let job of jobs) {
    let {id, eventBody} = job
    await request(eventBody)
    await remove(id)
  }
  return 'ok'
}

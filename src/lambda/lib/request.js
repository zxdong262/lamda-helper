/**
 * do request
 */

import fetch from 'node-fetch'
import {log} from './common'

export function request (eventBody) {
  let {
    url,
    body,
    method = 'get',
    headers = {}
  } = eventBody
  return fetch(url, {
    body,
    method,
    headers
  })
    .then(res => res.status)
    .catch(err => {
      log('fetch url:', url, 'error')
      log('method:', method)
      log('body:', body)
      log('headers:', headers)
      log(err.stack)
      return false
    })
}

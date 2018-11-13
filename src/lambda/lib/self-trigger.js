/**
 * trigger self event
 * from https://github.com/tylerlong/ringcentral-chatbot-js/compare/31a0989458c9690e6cd96bcc57563efad1fdde87...master
 */


import {delay} from './common'

export default async (event) => {
  console.log('event to trigger', event)
  const Lambda = require('aws-sdk/clients/lambda')
  const lambda = new Lambda({ region: process.env.AWS_REGION })
  let opts = {
    FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
    InvocationType: 'Event', // so `lambda.invoke` is async
    Payload: JSON.stringify(event)
  }
  console.log(opts, 'opts')
  lambda.invoke(opts, (error, data) => {
    console.log(data, error)
  })
  await delay(2000)
}

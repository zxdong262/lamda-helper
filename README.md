# lamda-helper
A lamda service helps dealing with api gateway timeout issue.

## Why it is needed
Aws lamda is powerful tool, but it has some limitations, timeout issue is one of them, once handler returned result, lamda will be freazed, can not do some backgroud work. For example, lamda got a request to register a bot, need a 200 response to make it work, but with some fail operation, we need to retry one minute later, unfortunately in 30s, api gateway will timeout, how can we handle this?

## How this service solve it
Follow the case, we could send a request to some service, tell this service to send back a request as we need in one minute later, then the lamda take this request oppotunity to do the retry, then we could just send 200 response to bot register safely. So this is the service.

## how it works
This service expose a `/cron-job` api gateway url, user can send post request to it, with body:
```js
{
  url: 'https://xxxx.xx/xxx',
  body: {...},
  method: METHOD,
  headers: {...},
  after: 1, // one minutes later
  retry: 3, // retry how many times if got not 200 response
  interval: 1 // retry interval
}
```
Then this service will just send request as told, that is it.

## developing...

## License
MIT


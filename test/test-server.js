
import Koa from 'koa'
import mount from 'koa-mount'
import Bodyparser from 'koa-bodyparser'
import logger from 'koa-logger'
import serve from 'koa-static'
import conditional from 'koa-conditional-get'
import etag from 'koa-etag'
import compress from 'koa-compress'
import Router from 'koa-router'
import {log} from '../src/lambda/lib/common'
import http from 'http'
import {resolve} from 'path'
import fetch from 'node-fetch'

const p = resolve(
  process.cwd(),
  'package.json'
)
const pack = require(p)
const {
  TESTPORT = 7800,
  TESTHOST = 'localhost',
  TESTURL,
  TESTCALLBACK
} = process.env

const isProduction = process.env.NODE_ENV === 'production'
const cwd = process.cwd()
const app = new Koa()
const staticOption = () => ({
  maxAge: 1000 * 60 * 60 * 24 * 365,
  hidden: true
})
const bodyparser = Bodyparser()

const start = function () {
  app.keys = ['helper:' + Math.random()]
  app.use(compress({
    threshold: 2048,
    flush: require('zlib').Z_SYNC_FLUSH
  }))
  app.use(conditional())
  app.use(etag())
  app.use(
    mount('/', serve(cwd + '/bin', staticOption()))
  )
  app.use(bodyparser)
  if (!isProduction) {
    app.use(logger())
  }
  //global error handle
  app.use(async (ctx, next) => {
    try {
      await next()
    } catch(e) {
      log('server error', e.stack)
      //500 page
      ctx.status = 500
      ctx.body = {
        stack: e.stack,
        message: e.message
      }
    }
  })

  //handler wrapper
  let handler = async (ctx) => {
    let event = {
      headers: ctx.headers,
      queryStringParameters: ctx.query,
      body: ctx.request.body,
      path: ctx.path,
      pathParameters: ctx.params
    }
    log(event)
    ctx.body = 'ok'
  }

  //routers
  let router = new Router()
  router.get('/', async ctx => {
    ctx.body = `${pack.name} test server running`
  })
  router.get('/favicon.ico', async ctx => ctx.body = '')
  router.post('/callback', handler)

  app
    .use(router.routes())
    .use(router.allowedMethods())

  let server = http.Server(app.callback())
  server.listen(TESTPORT, TESTHOST, () => {
    log(`${pack.name} server start on --> http://${TESTHOST}:${TESTPORT}`)
  })

  setTimeout(() => {
    fetch(TESTURL, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: TESTCALLBACK,
        method: 'post'
      })
    })
      .then(res => res.text())
      .then(console.log)
      .catch(e => {
        log(e)
      })
  }, 12)

  setTimeout(() => {
    fetch(TESTURL, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: TESTCALLBACK,
        scheduledTime: + new Date() + 1 * 60 * 1000,
        method: 'post',
        headers: {
          dfgf: 'sdf'
        }
      })
    })
      .then(res => res.text())
      .then(console.log)
      .catch(e => {
        log(e)
      })
  }, 1000)

}

try {
  start()
} catch (e) {
  log(`error start ${pack.name}'`, e)
  process.exit(1)
}

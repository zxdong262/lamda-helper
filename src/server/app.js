
import Koa from 'koa'
import mount from 'koa-mount'
import Bodyparser from 'koa-bodyparser'
import logger from 'koa-logger'
import serve from 'koa-static'
import conditional from 'koa-conditional-get'
import etag from 'koa-etag'
import compress from 'koa-compress'
import Router from 'koa-router'
import {task, cron} from '../lambda/handler'
import {log} from '../lambda/lib/common'
import http from 'http'
import {resolve} from 'path'

const cronJob = require('node-cron')
const {CRON} = process.env
const p = resolve(
  process.cwd(),
  'package.json'
)
const pack = require(p)
const {
  PORT = 7867,
  HOST = 'localhost'
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
  app.keys = ['rc-bot:' + Math.random()]
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
  //lambda handler wrapper
  let handler = async (ctx) => {
    let event = {
      headers: ctx.headers,
      queryStringParameters: ctx.query,
      body: ctx.request.body,
      path: ctx.path,
      method: ctx.method,
      pathParameters: ctx.params
    }
    let res = await task(event)
    if (res.headers) {
      ctx.set(res.headers)
    }
    ctx.status = res.statusCode
    ctx.body = res.body
  }

  //routers
  let router = new Router()
  router.get('/', async ctx => {
    ctx.body = `${pack.name} server running`
  })
  router.get('/favicon.ico', async ctx => ctx.body = '')
  router.all('/:action', handler)

  app
    .use(router.routes())
    .use(router.allowedMethods())

  let server = http.Server(app.callback())
  server.listen(PORT, HOST, () => {
    log(`${pack.name} server start on --> http://${HOST}:${PORT}`)
  })

  //run cron job
  cronJob.schedule(CRON, cron)
  log('running cron job:', CRON)
}

try {
  start()
} catch (e) {
  log(`error start ${pack.name}'`, e)
  process.exit(1)
}

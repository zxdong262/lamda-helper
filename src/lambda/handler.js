global.bot = {}
global.Promise = require('bluebird')

const hub = require('./lib/hub').default

// handle /{action} request
exports.task = async function (event) {
  return hub(event)
}

// handle cron job
exports.cron = require('./lib/cron').default

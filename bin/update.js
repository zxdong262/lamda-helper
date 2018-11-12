const {exec} = require('shelljs')
exec('yarn compile')
exec('yarn deploy-to-aws')

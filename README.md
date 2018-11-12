# lambda-helper
A lambda service helps dealing with api gateway timeout issue.

## Why it is needed
Aws lambda is powerful tool, but it has some limitations, timeout issue is one of them, once handler returned result, lambda will be freazed, can not do some backgroud work. For example, lambda got a request to register a bot, need a 200 response to make it work, but with some fail operation, we need to retry one minute later, unfortunately in 30s, api gateway will timeout, how can we handle this?

## How this service solve it
Follow the case, we could send a request to some service, tell this service to send back a request as we need in one minute later, then the lambda take this request oppotunity to do the retry, then we could just send 200 response to bot register safely. So this is the service.

## how it works
This service expose a `/task` api gateway url, user can send post request to it, with body:
```js
{
  // required, url you want the service to send request
  url: 'https://xxxx.xx/xxx',

  // the service would send request with this body
  // default is undefined
  body: {...},

  // the service will send request with this method,
  // could be one of get, post, put, delete
  // default is get
  method: 'get',

  // the service will send request with these headers
  // default is {}
  headers: {},

  // scheduled time for the service to send the request
  // default is undefined, server will send at once
  // be aware that it won't be precise, could be one minute late or more, for example, you want it run in 09:55:55, could happen in 09:56:55, if scheduled more task, could be delayed more time.
  scheduledTime: 1541727882458
}
```
Then this service will just send request as told, that is it.

**Prerequisites**

- Node.js >= 8.10
- Yarn
- a Google API account with a [saved Google credentials file](https://cloud.google.com/docs/authentication/getting-started)
- Get an AWS account, create `aws_access_key_id` and `aws_secret_access_key` and place them in `~/.aws/credentials`, like this:

```bash
[default]
aws_access_key_id = <your aws_access_key_id>
aws_secret_access_key = <your aws_secret_access_key>
```

### Setup the Project

```bash
git clone git@github.com:zxdong262/lamda-helper.git
# or git clone https://github.com/zxdong262/lamda-helper.git
cd lamda-helper

# create local env
cp .sample.env .env

## install dependencies
yarn

## start local server
yarn start

## local test
yarn test
```

## Building and Running Your App in Production

```bash
# install pm2 first if you wanna use pm2
yarn global add pm2
# or `npm i -g pm2`

# build
yarn build

# run production server
yarn prod-server

# or use pm2
pm2 start bin/pm2.yml
```

## Building and Deploying to AWS Lambda

```bash
cp lamda/serverless.sample.yml lamda/serverless.yml
```

Edit `lamda/serverless.yml`, and make sure you set the proper name and required env.

```yml
# you can define service wide environment variables here
  environment:
    NODE_ENV: production
    # db
    DB_TYPE: dynamodb
    DYNAMODB_TABLE_PREFIX: rc_ai_bot1
    DYNAMODB_REGION: us-east-1

```

Deploy to AWS Lambda with `yarn deploy`

```bash
# Run this cmd to deploy to AWS Lambda, full build, may take more time
yarn deploy

## watch Lambda server log
yarn watch

## update function
yarn update
```

- Create API Gateway for your Lambda function, shape as `https://xxxx.execute-api.us-east-1.amazonaws.com/default/poc-your-helper-name-dev-bot/{action+}`
- Make sure your Lambda function role has permission to read/write dynamodb(Set this from AWS IAM roles, could simply attach `AmazonDynamoDBFullAccess` policy to Lambda function's role)
- Make sure your Lambda function's timeout more than 5 minutes
- Then `https://xxxx.execute-api.us-east-1.amazonaws.com/default/poc-your-helper-name-dev-bot/task` would be service url.

## License
MIT


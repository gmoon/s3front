/* eslint-disable import/no-extraneous-dependencies, no-console, import/no-unresolved */

/*
  S3Proxy Express Framework Example

  Passes HTTP GET requests to s3proxy
  Start: PORT=3000 node express
  Test: mocha test.js

  Author: George Moon <george.moon@gmail.com>
*/

const helmet = require('helmet');
const express = require('express');
const debug = require('debug')('s3proxy');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const addRequestId = require('express-request-id')({ headerName: 'x-request-id' });
const S3Proxy = require('s3proxy');

const port = process.env.PORT;
const bucket = process.env.BUCKET;
const app = express();
app.set('view engine', 'pug');
app.use(addRequestId);
app.use(bodyParser.json());
app.use(helmet());

function handleError(req, res, err) {
  // sending xml because the AWS SDK sets content-type: application/xml for non-200 responses
  res.end(`<?xml version="1.0"?>\n<error time="${err.time}" code="${err.code}" statusCode="${err.statusCode}" url="${req.url}" method="${req.method}">${err.message}</error>
  `);
}

// Use morgan for request logging except during test execution
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(
    'request :remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] '
    + '":referrer" ":user-agent" ":response-time ms" :res[x-request-id] :res[x-amz-request-id]',
  ));
}

// initialize the s3proxy
const proxy = new S3Proxy({ bucket, logger: console });
proxy.init();
proxy.on('error', (err) => {
  console.log(`error initializing s3proxy for bucket ${bucket}: ${err.statusCode} ${err.code}`);
});

// basic health check
app.get('/health', (req, res) => {
  res.writeHead(200);
  res.end();
});

// health check s3
app.get('/health/s3', (req, res) => {
  proxy.healthCheckStream(res).on('error', () => {
    // just end the request and let the HTTP status code convey the error
    res.end();
  }).pipe(res);
});

// route all get requests to s3proxy
app.get('/', (req, res) => {
  res.redirect('/index.html');
});

app.route('/*')
  .head(async (req, res) => {
    await proxy.head(req, res);
    res.end();
  })
  .get((req, res) => {
    proxy.get(req, res).on('error', (err) => {
      handleError(req, res, err);
    }).pipe(res);
  });

proxy.on('init', () => {
  if (port > 0) {
    app.listen(port, () => {
      debug(`listening on port ${port}`);
      process.send('ready'); // for pm2-runtime wait_ready option
    });
  }
});

module.exports = app;

const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const { StringDecoder } = require('string_decoder');
const config = require('../lib/config');
const controller = require('../api/controller');
const helpers = require('../lib/helpers');
const path = require('path');

const server = {};

server.unifiedServer = (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, '');
  const queryStringObject = parsedUrl.query;
  const method = req.method.toLowerCase();
  const headers = req.headers;
  const decoder = new StringDecoder('utf-8');
  let buffer = '';
  req.on('data', (data) => {
    console.log(data, 'data')
    buffer += decoder.write(data);
  });
  req.on('end', () => {
    buffer += decoder.end();
    const chosenHandler = server.router[trimmedPath] || server.router.notFound;
    const data = {
      trimmedPath,
      queryStringObject,
      method,
      headers,
      payload: {
        ...helpers.parseJsonToObject(buffer),
        ...queryStringObject,
      },
    };
    chosenHandler(data, (statusCode = 200, payload = {}) => {
      const payloadString = JSON.stringify(payload);
      res.setHeader('Content-type', 'application/json')
      res.writeHead(statusCode);
      res.end(payloadString);
      console.log(payloadString, statusCode);
    })
  });
};

server.httpsServerOptions = {
  key: fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '/../https/cert.pem')),
};

server.httpServer = http.createServer((req, res) => {
  server.unifiedServer(req, res);
});

server.httpsServer = https.createServer(server.httpsServerOptions, (req, res) => {
  server.unifiedServer(req, res);
});

server.init = () => {
  server.httpServer.listen(config.httpPort, () => console.log(`server is listenning on port ${config.httpPort}`));
  server.httpsServer.listen(config.httpsPort, () => console.log(`server is listenning on port ${config.httpsPort}`));
}

server.router = {
  'ping': controller.ping,
  'users': controller.users,
  'tokens': controller.tokens,
  'checks': controller.checks,
  'notFound': controller.notFound,
};

module.exports = server;
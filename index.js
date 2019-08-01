const server = require('./service/server');
const workers = require('./service/workers');

const app = {
  init() {
    server.init();
    workers.init();
  }
};

app.init();

module.exports = app;
const { tokenHandlers, userHandlers, checkHandlers } = require('./handlers');

class Controller {
  ping(data, callBack) {
    callBack(200);
  }
  
  users(data, callBack) {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.includes(data.method)) {
      userHandlers[data.method](data, callBack);
    } else {
      callBack(405);
    }
  }
  
  tokens(data, callBack) {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.includes(data.method)) {
      tokenHandlers[data.method](data, callBack);
    } else {
      callBack(405);
    }
  }
  
  checks(data, callBack) {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.includes(data.method)) {
      checkHandlers[data.method](data, callBack);
    } else {
      callBack(405);
    }
  }
  
  notFound(data, callBack) {
    callBack(404);
  }
}

module.exports = new Controller();
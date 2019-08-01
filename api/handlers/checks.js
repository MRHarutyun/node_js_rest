const _data = require('../../lib/data');
const config = require('../../lib/config');
const helpers = require('../../lib/helpers');
const tokenHandlers = require('./token');

const checkHandlers = {
  post(data, callBack) {
    const protocol = data.payload.protocol
      && ['http', 'https']
        .includes(data.payload.protocol)
      ? data.payload.protocol : null;
    const url = data.payload.url
      && data.payload.url.trim().length
      ? data.payload.url.trim() : null;
    const method = data.payload.method
      && ['post', 'get', 'put', 'delete']
        .includes(data.payload.method)
      ? data.payload.method : null;
    const successCodes = data.payload.successCodes
      && data.payload.successCodes.length
      ? data.payload.successCodes : null;
    const timeoutSeconds = data.payload.timeoutSeconds >= 1
      && data.payload.timeoutSeconds <= 5
      && typeof data.payload.timeoutSeconds === 'number'
      && data.payload.timeoutSeconds % 1 === 0
      ? data.payload.timeoutSeconds : null;
    if (protocol && url && method && successCodes && timeoutSeconds) {
      const token = data.headers.token || null;
      _data.read('tokens', token, (err, tokenData) => {
        if (!err && tokenData) {
          const { phone } = tokenData;
          _data.read('users', phone, (err, user) => {
            if (!err && user) {
              const userChecks = user.checks && user.checks.length ? user.checks : [];
              if (userChecks.length < config.maxChecks) {
                const checkId = helpers.createToken(20);
                const checkObject = {
                  id: checkId,
                  phone,
                  protocol,
                  url,
                  method,
                  successCodes,
                  timeoutSeconds,
                };

                _data.create('checks', checkId, checkObject, (err) => {
                  if (!err) {
                    user.checks = userChecks;
                    user.checks.push(checkId);
                    _data.update('users', phone, user, (err) => {
                      if (!err) {
                        callBack(200, checkObject);
                      } else {
                        callBack(500, { Error: 'Could not update the user with the new check' });
                      }
                    })
                  } else {
                    callBack(500, { Error: 'Could not crate a new check' });
                  }
                })
              } else {
                callBack(400, { Error: 'The user already has the maximum number of checks' });
              }
            } else {
              callBack(403);
            }
          })
        } else {
          callBack(403);
        }
      })
    } else {
      callBack(400, { Error: 'Missing required inputs or inputs are invalid' });
    }
  },

  get(data, callBack) {
    const id = data.payload.id && data.payload.id.trim().length === 20 ? data.payload.id.trim() : null;
    if (id) {
      _data.read('checks', id, (err, checkData) => {
        if (!err && checkData) {
          const token = data.headers.token || null;
          tokenHandlers.verifyToken(token, checkData.phone, (tokenIsValid) => {
            if (tokenIsValid) {
              callBack(200, checkData);
            } else {
              callBack(403);
            }
          });
        } else {
          callBack(404);
        }
      });
    } else {
      callBack(400, 'missing the required field')
    }
  },

  put(data, callBack) {
    const id = data.payload.id && data.payload.id.trim().length === 20 ? data.payload.id.trim() : null;
    const protocol = data.payload.protocol
      && ['http', 'https']
        .includes(data.payload.protocol)
      ? data.payload.protocol : null;
    const url = data.payload.url
      && data.payload.url.trim().length
      ? data.payload.url.trim() : null;
    const method = data.payload.method
      && ['post', 'get', 'put', 'delete']
        .includes(data.payload.method)
      ? data.payload.method : null;
    const successCodes = data.payload.successCodes
      && data.payload.successCodes.length
      ? data.payload.successCodes : null;
    const timeoutSeconds = data.payload.timeoutSeconds >= 1
      && data.payload.timeoutSeconds <= 5
      && typeof data.payload.timeoutSeconds === 'number'
      && data.payload.timeoutSeconds % 1 === 0
      ? data.payload.timeoutSeconds : null;
    if (id) {
      if (protocol || url || method || successCodes || timeoutSeconds) {        
        _data.read('checks', id, (err, checkData) => {
          if (!err && checkData) {
            const token = data.headers.token || null;
            tokenHandlers.verifyToken(token, checkData.phone, (tokenIsValid) => {
              if (tokenIsValid) {                
                if (protocol) checkData.protocol = protocol;
                if (url) checkData.url = url;
                if (method) checkData.method = method;
                if (successCodes) checkData.successCodes = successCodes;
                if (timeoutSeconds) checkData.timeoutSeconds = timeoutSeconds;
                _data.update('checks', id, checkData, (err) => {
                  if (!err) {
                    callBack(200);
                  } else {
                    callBack(500, { Error: 'Could not update the check' });
                  }
                });
              } else {
                callBack(403);
              }});
          } else {
            callBack(400, { Error: 'check id did not exist' });
          }
        });
      } else {
        callBack(400, { Error: 'Missing fields for update' });
      }
    } else {
      callBack(400, { Error: 'Missing required field' });
    }
  },

  delete(data, callBack) {
    const id = data.payload.id && data.payload.id.trim().length === 20 ? data.payload.id.trim() : null;
    if (id) {
      _data.read('checks', id, (err, checkData) => {
        if (!err && checkData) {
          const token = data.headers.token || null;
          tokenHandlers.verifyToken(token, checkData.phone, (tokenIsValid) => {
            if (tokenIsValid) {
              _data.delete('checks', id, (err) => {
                if (!err) {
                  _data.read('users', checkData.phone, (err, user) => {
                    if (!err && user) {
                      const userChecks = user.checks && user.checks.length ? user.checks : [];
                      const checkPosition = userChecks.indexOf(id);
                      if (checkPosition > -1) {
                        userChecks.splice(checkPosition, 1);
                        _data.update('users', checkData.phone, user, (err) => {
                          if (!err) {
                            callBack(200);
                          } else {
                            callBack(500, { Error: 'could not update user' })
                          }
                        });
                      } else {
                        callBack(500, { Error: 'Could not find the check on the users object so could not remove it' })
                      }
                    } else {
                      callBack(400, { Error: 'could not find the user who created the check so could not remove the check' });
                    }
                  });
                } else {
                  callBack(500, { Error: 'Could not delete the check data' });
                }
              })
            } else {
              callBack(403);
            }
          });
        } else {
          callBack(400, { Error: 'The check id does not exist'});
        }
      })
    } else {
      callBack(400, 'missing the required field')
    }
  },
};

module.exports = checkHandlers;

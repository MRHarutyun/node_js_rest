const _data = require('../../lib/data');
const helpers = require('../../lib/helpers');

const tokenHandlers = {
  post(data, callBack) {
    const phone = data.payload.phone && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : null;
    const password = data.payload.password && data.payload.password.trim().length > 6 ? data.payload.password.trim() : null;
    if (phone  && password) {
      _data.read('users', phone, (err, user) => {
        if (!err && user) {
          const hashedPassword = helpers.hash(password);
          if (hashedPassword === user.hashedPassword) {
            const token = helpers.createToken(20);
            const expires = Date.now() + 1000 * 60 * 60;
            const tokenObject = {
              phone,
              id: token,
              expires,
            };
            _data.create('tokens', token, tokenObject, (err) => {
              if (!err) {
                callBack(200, tokenObject);
              } else {
                callBack(500, { Error: 'failed to create a new token'});
              }
            })
          } else {
            callBack(400, { Error: 'password did not match' });
          }
        } else {
          callBack(400, { Error: 'could not find the user' });
        }
      })
    } else {
      callBack(400, { Error: 'missing the required fields' });
    }
  },

  get(data, callBack) {
    const id = data.payload.id && data.payload.id.trim().length === 20 ? data.payload.id.trim() : null;
    if (id) {
      _data.read('tokens', id, (err, token) => {
        if (!err && token) {
          callBack(200, token);
        } else {
          callBack(404);
        }
      })
    } else {
      callBack(400, 'missing the required field')
    }
  },

  put(data, callBack) {
    const id = data.payload.id && data.payload.id.trim().length === 20 ? data.payload.id.trim() : null;
    const extend = data.payload.extend || false;
    if (id && extend) {
      _data.read('tokens', id, (err, token) => {
        if (!err && token) {
          if (token.expires > Date.now()) {
            token.expires = Date.now() + 1000 * 60 * 60;
            _data.update('tokens', id, token, (err) => {
              if (!err) {
                callBack(200);
              } else {
                callBack(500, { Error: 'could not update token expiration' });
              }
            })
          } else {
            callBack(400, { Error: 'the token is already expired and can not be extended' })
          }
        } else {
          callBack(400, { Error: 'token not found' });
        }
      })
    } else {
      callBack(400, { Error: 'missing requierd fields' });
    }
  },

  delete(data, callBack) {
    const id = data.payload.id && data.payload.id.trim().length === 20 ? data.payload.id.trim() : null;
    if (id) {
      _data.read('tokens', id, (err, token) => {
        if (!err && token) {
          _data.delete('tokens', id, (err) => {
            if (!err) {
              callBack(200);
            } else {
              callBack(500, { Error: 'could not delete token' })
            }
          })
        } else {
          callBack(400, { Error: 'could not find the token' });
        }
      })
    } else {
      callBack(400, 'missing the required field')
    }
  },

  verifyToken(id, phone, callBack) {
    _data.read('tokens', id, (err, token) => {
      if (!err && token) {
        if (token.phone === phone && token.expires > Date.now()) {
          callBack(true);
        } else {
          callBack(403, { Error: 'Unauthorised' });
        }
      } else {
        callBack(false);
      }
    })
  },
};

module.exports = tokenHandlers;
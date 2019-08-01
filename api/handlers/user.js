const _data = require('../../lib/data');
const helpers = require('../../lib/helpers');
const tokenHandlers = require('./token');

const userHandlers = {
  post(data, callBack) {
    const firstName = data.payload.firstName ? data.payload.firstName.trim() : null;
    const lastName = data.payload.lastName ? data.payload.lastName.trim() : null;
    const phone = data.payload.phone && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : null;
    const password = data.payload.password && data.payload.password.trim().length > 6 ? data.payload.password.trim() : null;
    const tosAgreement = data.payload.tosAgreement || false;

    if (firstName && lastName && phone && password && tosAgreement) {
      _data.read('users', phone, (err, data) => {
        if (err) {
          const hashedPassword = helpers.hash(password);
          if (hashedPassword) {
            const userObject = {
              firstName,
              lastName,
              phone,
              hashedPassword,
              tosAgreement,
            };
            _data.create('users', phone, userObject, (err) => {
              if (!err) {
                callBack(200);
              } else {
                console.log(err);
                callBack(500, { Error: 'could not create the new user' });
              }
            })
          } else {
            callBack(400, { 'Error': 'user with that phone number already exists' });
          }
        } else {
          callBack(500, { Error: 'could not hash the user password' });
        }
      })
    } else {
      callBack(400, 'missing required fields');
    }
  },

  get(data, callBack) {
    const phone = data.payload.phone && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : null;
    if (phone) {
      const token = data.headers.token || null;
      tokenHandlers.verifyToken(token, phone, (tokenIsValid) => {
        if (tokenIsValid) {
          _data.read('users', phone, (err, user) => {
            if (!err && user) {
              delete user.hashedPassword;
              callBack(200, user);
            } else {
              callBack(404);
            }
          });
        } else {
          callBack(403, { Error: 'missing required token in header or token is invalid' });
        }
      });
    } else {
      callBack(400, 'missing the required field')
    }
  },

  put(data, callBack) {
    const phone = data.payload.phone && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : null;
    const firstName = data.payload.firstName ? data.payload.firstName.trim() : null;
    const lastName = data.payload.lastName ? data.payload.lastName.trim() : null;
    const password = data.payload.password && data.payload.password.trim().length > 6 ? data.payload.password.trim() : null;
    if (phone) {
      if (firstName || lastName || password1) {
        const token = data.headers.token || null;
        tokenHandlers.verifyToken(token, phone, (tokenIsValid) => {
          if (tokenIsValid) {
            _data.read('users', phone, (err, user) => {
              if (!err && user) {
                if (firstName) user.firstName = firstName;
                if (lastName) user.lastName = lastName;
                if (password) user.hashedPassword = helpers.hash(password);
                _data.update('users', phone, user, (err) => {
                  if (!err) {
                    callBack(200);
                  } else {
                    console.log(err);
                    callBack(500, { Error: 'could not update user' });
                  }
                })
              } else {
                callBack(400, { Error: 'the specified user does not exist' });
              }
            });
          } else {
            callBack(403, { Error: 'missing required token in header or token is invalid' });
          }
        });
      } else {
        callBack(400, { Error: 'missing fields to update' });
      }
    } else {
      callBack(400, { Error: 'missing required field' });
    }
  },

  delete(data, callBack) {
    const phone = data.payload.phone && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : null;
    if (phone) {
      const token = data.headers.token || null;
      tokenHandlers.verifyToken(token, phone, (tokenIsValid) => {
        if (tokenIsValid) {
          _data.read('users', phone, (err, user) => {
            if (!err && user) {
              _data.delete('users', phone, (err) => {
                if (!err) {
                  const userChecks = user.checks && user.checks.length ? user.checks : [];
                  const checksToDelete = userChecks.length;
                  if (checksToDelete) {
                    let checksDeleted = 0;
                    let deletionErrors = false;
                    userChecks.forEach((id) => {
                      _data.delete('checks', id, (err) => {
                        if (!err) {
                          deletionErrors = true;
                        }
                        checksDeleted += 1;
                        if (checksDeleted === checksToDelete) {
                          if (!deletionErrors) {
                            callBack(200);
                          } else {
                            callBack(500, { Error: 'Error encountered while attemting to delete all of the users checks. All checks may not been deleted from the system successfully' });
                          }
                        }
                      });
                    })
                  } else {
                    callBack(200);
                  }
                } else {
                  callBack(500, { Error: 'could not delete user' })
                }
              })
            } else {
              callBack(400, { Error: 'could not find the user' });
            }
          });
        } else {
          callBack(403, { Error: 'missing required token in header or token is invalid' });
        }
      });
    } else {
      callBack(400, 'missing the required field')
    }
  },
};

module.exports = userHandlers;
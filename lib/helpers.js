const crypto = require('crypto');
const config = require('./config');
const https = require('https');
const queryString = require('querystring');

const helpers = {
  hash(str) {
    if (typeof str === 'string' && str.length) {
      const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
      return hash;
    } else {
      return false;
    }
  },

  parseJsonToObject(str) {
    try {
      const obj = JSON.parse(str);
      return obj;
    } catch (err) {
      return {};
    }
  },

  createToken(length) {
    if (length) {
      const possibleCherecters = 'qazwsxedcrfvtgbyhnujmikolp0123456789';
      let str = '';
      for (let i = 0; i < length; i++) {
        const randomCherector = possibleCherecters.charAt(Math.floor(Math.random() * possibleCherecters.length));
        str += randomCherector;
      }
      return str;
    } else {
      return null;
    }
  },

  sendMessage(phone, msg, callBack) {
    phone = phone && phone.trim().length === 10 ? phone.trim() : null;
    msg = msg && msg.trim().length && msg.trim().length <= 1600 ? msg.trim() : null;
    if (phone && msg) {
      const payload = {
        From: config.twilio.fromPhone,
        To: `+1${phone}`,
        Body: msg,
      };
      const stringPayload = queryString.stringify(payload);
      const requestDetails = {
        protocol: 'https:',
        hostname: 'api.twilio.com',
        method: 'POST',
        path: `/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`,
        auth: `${config.twilio.accountSid}:${config.twilio.authToken}`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(stringPayload),
        },
      };

      const req = https.request(requestDetails, (res) => {
        const status = res.statusCode;
        if (status === 200 || status === 201) {
          callBack(false);
        } else {
          callBack(`Status code returned was "${status}"`);
        }
      });
      req.on('error', (e) => {
        callBack(e);
      });
      req.write(stringPayload);
      req.end();
    } else {
      callBack(400, { Error: 'Given parameters were missing or invalid' })
    }
  }
};

module.exports = helpers;

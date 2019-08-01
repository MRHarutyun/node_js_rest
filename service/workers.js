const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const url = require('url');
const _data = require('../lib/data');
const helpers = require('../lib/helpers');

const workers = {};

workers.validateCheckData = (originalCheckData) => {
  originalCheckData = originalCheckData || {};
  originalCheckData.id = originalCheckData.id && originalCheckData.id.trim().length === 20 ? originalCheckData.id.trim() : null;
  originalCheckData.phone = originalCheckData.phone && originalCheckData.phone.trim().length === 10 ? originalCheckData.phone.trim() : null;
  originalCheckData.protocol = originalCheckData.protocol && ['http', 'https'].includes(originalCheckData.protocol) ? originalCheckData.protocol : null;
  originalCheckData.url = originalCheckData.url && originalCheckData.url.trim().length ? originalCheckData.url.trim() : null;
  originalCheckData.method = originalCheckData.method && ['post', 'get', 'put', 'delete'].includes(originalCheckData.method) ? originalCheckData.method : null;
  originalCheckData.successCodes = originalCheckData.successCodes && originalCheckData.successCodes.length ? originalCheckData.successCodes : null;
  originalCheckData.timeoutSeconds = originalCheckData.timeoutSeconds
    && originalCheckData.timeoutSeconds % 1 === 0
    && originalCheckData.timeoutSeconds >= 1
    && originalCheckData.timeoutSeconds <= 5
    ? originalCheckData.timeoutSeconds : null;
  originalCheckData.state = originalCheckData.state && ['up', 'down'].includes(originalCheckData.state) ? originalCheckData.state : 'down';
  originalCheckData.lastChecked = originalCheckData.lastChecked || null;
  console.log(originalCheckData, 'originalCheckData')
  if (
    originalCheckData.id
    && originalCheckData.phone
    && originalCheckData.protocol
    && originalCheckData.url
    && originalCheckData.method
    && originalCheckData.successCodes
    && originalCheckData.timeoutSeconds
  ) {
    workers.performCheck(originalCheckData);
  } else {
    console.log('Error: One of the checks is not proparly formated. Skipping it');
  }
};

workers.performCheck = (originalCheckData) => {
  const checkOutcome = {
    error: null,
    responseCode: null,
  };
  let outcomeSent = null;
  const parsedUrl = url.parse(originalCheckData.protocol+'://'+originalCheckData.url, true);
  const { hostname, path } = parsedUrl;

  const requestDetails = {
    protocol: originalCheckData.protocol+':',
    hostname,
    method: originalCheckData.method.toUpperCase(),
    path,
    timeout: originalCheckData.timeoutSeconds * 1000,
  };

  const _moduleToUse = originalCheckData.protocol === 'http' ? http : https;
  const req = _moduleToUse.request(requestDetails, (res) => {
    const status = res.statusCode;
    checkOutcome.responseCode = status;
    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  req.on('error', (e) => {
    checkOutcome.error = {
      error: true,
      value: e,
    };
    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  req.on('timeout', (e) => {
    checkOutcome.error = {
      error: true,
      value: 'timeout',
    };
    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  req.end();

};

workers.processCheckOutcome = (originalCheckData, checkOutcome) => {
  const state = !checkOutcome.error
    && checkOutcome.responseCode
    && originalCheckData.successCodes
      .includes(checkOutcome.responseCode)
    ? 'up' : 'down';

  const alertWarranted = originalCheckData.lastChecked && originalCheckData.state !== state ? true : false;

  const timeOfCheck = Date.now();
  workers.log(originalCheckData, checkOutcome, state, alertWarranted, timeOfCheck);

  const newCheckedData = originalCheckData;
  newCheckedData.state = state;
  newCheckedData.lastChecked = Date.now();

  _data.update('checks', newCheckedData.id, newCheckedData, (err) => {
    if (!err) {
      if (alertWarranted) {
        workers.alertUserToStatusChange(newCheckedData);
      } else {
        console.log('Check outcome has not changed, no alert needed')
      }
    } else {
      console.log('Error: trying to save updates to one of the checks');
    }
  })
};

workers.alertUserToStatusChange = () => {
  const msg = 'Alert: Your check for '+newCheckedData.method.toUpperCase()+' '+newCheckedData.protocol+'://'+newCheckedData.url+' is currently '+newCheckedData.state;
  helpers.sendMessage(newCheckedData.phone, msg, (err) => {
    if (!err) {
      console.log('Success: User was alerted to a status chenge in their check via sms', msg);
    } else {
      console.log('Error: Could not send sms alert to a user who has a state chnage in their check');
    }
  });
};

workers.log = (originalCheckData,checkOutcome, state, alertWarranted, timeOfCheck) => {
  const logData = {
    check: originalCheckData,
    outcome: checkOutcome,
    state,
    alert: alertWarranted,
    time: timeOfCheck,
  };

  const logString = JSON.stringify(logData);
  const logFileName= originalCheckData.id;
  _logs.append(logFileName, logString, (err) => {
    if ()
  })
};

workers.gatherAllChecks = () => {
  _data.list('checks', (err, checks) => {
    if (!err && checks && checks.length) {
      checks.forEach(check => {
        _data.read('checks', check, (err, originalCheckData) => {
          if (!err && originalCheckData) {
            workers.validateCheckData(originalCheckData);
          } else {
            console.log('Error: reading one of the checks data');
          }
        });
      });
    } else {
      console.log('Error: Could not find any checks to process');
    }
  });
};

workers.loop = () => {
  setInterval(workers.gatherAllChecks, 1000 * 60);
};

workers.init = () => {
  workers.gatherAllChecks();
  workers.loop();
};

module.exports = workers;
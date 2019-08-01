const environments = {
  stage: {
    httpPort: 3000,
    httpsPort: 3001,
    envName: 'stage',
    hashingSecret: 'thisisasecret',
    maxChecks: 5,
    twilio: {
      accountSid: 'ACb32d411ad7fe886aac54c665d25e5c5d',
      authToken: '9455e3eb3109edc12e3d8c92768f7a67',
      fromPhone: '+15005550006',

    },
  },

  production: {
    httpPort: 5000,
    httpsPort: 5001,
    envName: 'production',
    hashingSecret: 'thisisasecret',
    maxChecks: 5,
    twilio: {
      accountSid: '',
      authToken: '',
      fromPhone: '',

    },
  },
}

const currentEnvironment = process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : 'stage';
const environmentToExport = environments[currentEnvironment] || '';

module.exports = environmentToExport;
exports.config = {
  allScriptsTimeout: 10000,

  specs: [
    '*.js'
  ],

  capabilities: {
    'browserName': 'chrome'
  },

  baseUrl: 'http://localhost:8172/',

  framework: 'jasmine',

  jasmineNodeOpts: {
    defaultTimeoutInterval: 5000
  }
};

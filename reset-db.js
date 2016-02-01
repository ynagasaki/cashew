'use strict';

(function() {
  var http = require('http');
  var app_name = 'cashew';
  var HOSTNAME = 'localhost';
  var PORT = 5984;
  var ENDPOINT = 'http://' + HOSTNAME + ':' + PORT;
  var DDOC_NAME = 'app';
  var VIEWS = require('./couchdb/views.js');
  var UTILS = require('./cashew-utils.js');

  UTILS.setEndpoint(HOSTNAME, PORT);

  var check_couchdb = function(next_action) {
    console.log("* Checking CouchDB connection on: " + ENDPOINT);
    http.get(ENDPOINT, function(res) {
      console.log("CouchDB is running: " + res.statusCode);
      next_action();
    }).on('error', function(e) {
      console.error("Couldn't connect to CouchDB: " + e.message);
    });
  };

  var wipe_db = function() {
    console.log("\n* Wiping any existing instance of '" + app_name + "'...");
    UTILS.request('DELETE', app_name, create_db);
  };

  var create_db = function() {
    console.log("\n* Creating DB '" + app_name + "'...");
    UTILS.request('PUT', app_name, create_design);
  };

  var create_design = function() {
    console.log("\n* Creating/updating design doc '" + DDOC_NAME + "'...");
    var path = app_name + '/_design/' + DDOC_NAME;
    var design_doc = {
      views : VIEWS.getAll()
    };
    var success_func = function() { console.log('DONE FOR NOW.'); };
    var put_design_func = function() {
      UTILS.requestJson('PUT', path, design_doc, success_func);
    };

    UTILS.request('GET', path, 
      /* If the design doc exists, delete it first, then create it */
      function(result) {
        var rev = result._rev;
        console.log("  Updating design doc: " + rev);
        UTILS.requestGeneral('PUT', path, {rev:rev, ctype:'application/json'}, JSON.stringify(design_doc), success_func);
      },
      /* else, "GET" will fail, which is fine; just run the create routine */
      put_design_func
    );
  };

  if (process.argv[2] && process.argv[2] === '--reinstall') {
    check_couchdb(function() {
      UTILS.request('GET', app_name, wipe_db, create_db);
    });
  } else {
    check_couchdb(create_design);
  }
})();

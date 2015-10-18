'use strict';

(function() {
  var http = require('http');
  var app_name = 'cashew';
  var HOSTNAME = 'localhost';
  var PORT = 5984;
  var ENDPOINT = 'http://' + HOSTNAME + ':' + PORT;
  var DDOC_NAME = 'app';
  var VIEWS = require('./couchdb/views.js');

  var request_in_general = function(method, path, content_type, data, next_action, fail_action) {
    var options = {
      hostname: HOSTNAME,
      port: PORT,
      path: '/' + path,
      method: method
    };

    if (content_type) {
      options.headers = {
        'Content-Type': content_type
      };
    }
    
    var req = http.request(options, function(res) {
      var body = [];
      res.on('data', function(d) {
        body.push(d);
      });
      res.on('end', function() {
        var result = JSON.parse(body.join(' '));
        if (result.error) {
          console.warn(result.error + " because " + result.reason);
          if (fail_action) {
            console.log("(Ignoring...)");
            fail_action();
          } else {
            console.log("(Exiting)");
            process.exit(1);
          }
        } else {
          console.log("(Ok)");
          next_action();
        }
      });
    }).on('error', console.error);

    if (data) {
      req.write(data);
    }

    req.end();
  };

  var request = function(method, path, next_action, fail_action) {
    request_in_general(method, path, null, null, next_action, fail_action);
  };

  var request_json = function(method, path, data, next_action, fail_action) {
    request_in_general(method, path, 'application/json', JSON.stringify(data), next_action, fail_action);
  };

  var check_couchdb = function() {
    console.log("* Checking CouchDB connection on: " + ENDPOINT);
    http.get(ENDPOINT, function(res) {
      console.log("CouchDB is running: " + res.statusCode);
      request('GET', app_name, wipe_db, create_db);
    }).on('error', function(e) {
      console.error("Couldn't connect to CouchDB: " + e.message);
    });
  };

  var wipe_db = function() {
    console.log("\n* Wiping any existing instance of '" + app_name + "'...");
    request('DELETE', app_name, create_db);
  };

  var create_db = function() {
    console.log("\n* Creating DB '" + app_name + "'...");
    request('PUT', app_name, create_design);
  };

  var create_design = function() {
    console.log("\n* Creating design doc '" + DDOC_NAME + "'...");
    var design_doc = {
      views : VIEWS.getAll()
    };
    request_json('PUT', app_name + '/_design/' + DDOC_NAME, design_doc, function(){console.log('DONE FOR NOW.');});
  };

  check_couchdb();
})();

'use strict';

(function() {
  var http = require('http');
  var HOSTNAME = 'localhost';
  var PORT = 8172;

  var request_in_general = function(method, path, headers, data, next_action, fail_action) {
    var options = {
      hostname: HOSTNAME,
      port: PORT,
      path: '/' + path,
      method: method
    };

    if (headers) {
      options.headers = {};
      if (headers.ctype) {
        options.headers['Content-Type'] = headers.ctype;
      }
      if (headers.rev) {
        options.headers['If-Match'] = headers.rev;
      }
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
            fail_action(result);
          } else {
            console.log("(Exiting)");
            process.exit(1);
          }
        } else {
          console.log("(Ok)");
          next_action(result);
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
    request_in_general(method, path, {ctype:'application/json'}, JSON.stringify(data), next_action, fail_action);
  };

  exports.setEndpoint = function(host, port) {
    HOSTNAME = host;
    PORT = port;
  };

  exports.request = request;
  exports.requestJson = request_json;
  exports.requestGeneral = request_in_general;
})();

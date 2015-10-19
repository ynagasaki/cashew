'use strict';

(function() {
  var nano = require('nano')('http://localhost:5984');
  var cashew_db = nano.db.use('cashew');
  var express = require('express');
  var bodyParser = require('body-parser');
  var app = express();
  var jsonParser = bodyParser.json();

  app.use(express.static('app'));

  app.get('/hello', function(req, res) {
    res.send('world!');
  });

  app.get('/api/get/payables', function(req, res) {
    console.log('get/payables');
    cashew_db.view('app', 'payables', function(err, body) {
      if (err) {
        res.status(500).json({ msg: 'error: could not get payables', data: err});
      }
      var items = [];
      body.rows.forEach(function(row) {
        items.push(row.value);
      });
      res.json({ data: items });
    });
  });

  app.get('/api/get/line-items', function(req, res) {
    console.log('GET');
    cashew_db.view('app', 'line-items', function(err, body) {
      if (err) {
        res.status(500).json({ msg: 'error: could not get line items', data: err});
      }
      var items = [];
      body.rows.forEach(function(row) {
        items.push(row.value);
      });
      res.json({ data: items });
    });
  });

  app.put('/api/put/line-item', jsonParser, function(req, res) {
    if (!req.body) {
      return res.status(400).json({ msg: 'error: no body' });
    }
    console.log('PUT ' + req.body.name);
    cashew_db.insert(req.body, function(err, body) {
      if (err) {
        res.status(500).json({ msg: 'error: save failed', data: err });
        return;
      }
      res.json({ msg: 'inserted', data: body });
    });
  });

  app.delete('/api/delete/line-item/:id/:rev', function(req, res) {
    console.log('DELETE ' + req.params.id + ' ' + req.params.rev);
    cashew_db.destroy(req.params.id, req.params.rev, function(err, body) {
      if (err) {
        res.status(500).json({ msg: 'error: delete failed', data: err});
        return;
      }
      res.json({ msg: 'deleted', data: body });
    });
  });

  var server = app.listen(3000, function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log('cashew listening at http://%s:%s', host, port);
  });
})();

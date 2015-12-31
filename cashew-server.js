'use strict';

(function() {
  var PORT = 8172;
  var nano = require('nano')('http://localhost:5984');
  var cashew_db = nano.db.use('cashew');
  var express = require('express');
  var bodyParser = require('body-parser');
  var moment = require('moment');
  var app = express();
  var jsonParser = bodyParser.json();

  var payableKeysAreEqual = function(key1, key2) {
    var i;
    var len = key1.length;
    if (len !== key2.length) {
      return false;
    }
    for (i = 0; i < len; ++i) {
      if (key1[i] !== key2[i]) {
        return false;
      }
    }
    return true;
  };

  app.use(express.static('app'));

  app.get('/hello', function(req, res) {
    res.send('world!');
  });

  app.put('/api/pay', jsonParser, function(req, res) {
    var payment = req.body;
    if (!payment) {
      return res.status(400).json({ msg: 'error: no body' });
    }
    console.log('pay: ' + payment.key);
    cashew_db.insert(payment, function(err, body) {
      if (err) {
        res.status(500).json({ msg: 'error: save failed', data: err });
        return;
      }
      res.json({ msg: 'inserted', data: body });
    });
  });

  app.get('/api/get/payables/:from/:to', function(req, res) {
    var momentFrom = moment.unix(req.params.from);
    var momentTo = moment.unix(req.params.to);
    console.log('get/payables/' + momentFrom.format() + '/' + momentTo.format());
    cashew_db.view('app', 'payables', function(err, body) {
      if (err) {
        res.status(500).json({ msg: 'error: could not get payables', data: err});
      }
      var items = [];
      var last_payable;
      body.rows.forEach(function(row) {
        var value = row.value;
        value.key = row.key[0];
        if (value.doctype === 'payable') {
          console.log('  pushing payable: ' + value.name + '\t' + value.key);
          items.push(value);
          last_payable = value;
        } else if (value.doctype === 'payment') {
          if (!last_payable) {
            console.log('    SKIP payment: last payable is null');
            return;
          }
          if (!payableKeysAreEqual(value.key, last_payable.key)) {
            console.log('    SKIP payment: last payable is incompatible: ' + last_payable.key + ' !== ' + value.key); 
            return;
          }
          console.log('    prepending payment \'' + value._id + '\' to payable: ' + last_payable.name);
          if (!last_payable.payments) {
            last_payable.payments = [];
          }
          last_payable.payments.unshift(value);
        }
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
    var item = req.body;
    if (!item) {
      return res.status(400).json({ msg: 'error: no body' });
    }
    console.log('PUT ' + item.name);
    item.doctype = 'lineitem';
    cashew_db.insert(item, function(err, body) {
      if (err) {
        res.status(500).json({ msg: 'error: save failed', data: err });
        return;
      }
      res.json({ msg: 'inserted', data: body });
    });
  });

  app.delete('/api/delete/:id/:rev', function(req, res) {
    console.log('DELETE ' + req.params.id + ' ' + req.params.rev);
    cashew_db.destroy(req.params.id, req.params.rev, function(err, body) {
      if (err) {
        res.status(500).json({ msg: 'error: delete failed', data: err});
        return;
      }
      res.json({ msg: 'deleted', data: body });
    });
  });

  var server = app.listen(PORT, function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log('cashew listening at http://%s:%s', host, port);
  });
})();

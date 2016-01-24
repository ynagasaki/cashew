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

  app.use(express.static('app'));

  app.get('/hello', function(req, res) {
    res.send('world!');
  });

  app.put('/api/pay', jsonParser, function(req, res) {
    var payment = req.body;
    if (!payment) {
      return res.status(400).json({ msg: 'error: no body' });
    }
    payment.doctype = 'payment';
    /*console.log('pay: ' + payment.key);*/
    cashew_db.insert(payment, function(err, body) {
      if (err) {
        res.status(500).json({ msg: 'error: save failed', data: err });
        return;
      }
      res.json({ msg: 'inserted', data: body });
    });
  });

  app.get('/api/get/payables/:from/:to', function(req, res) {
    var from = moment.unix(req.params.from);
    var to = moment.unix(req.params.to);
    var start = [from.year(), from.month()+1, from.date(), null];
    var end = [to.year(), to.month()+1, to.date(), {}];

    /*console.log('get/payables/' + from.format('YYYY-MM-DD') + '/' + to.format('YYYY-MM-DD'));*/
    cashew_db.view('app', 'payables', function(err, body) {
      if (err) {
        res.status(500).json({ msg: 'error: could not get payables', data: err});
        return;
      }

      var items = [];
      var itemsMap = {};

      console.log('* Retrieved payables: ' + body.rows.length);
      body.rows.forEach(function(row) {
        var value = row.value;
        value.key = row.key;
        if (value.doctype === 'payable') {
          /*console.log('  pushing payable: ' + (value.name || value.original.name) + '\t' + value.key);*/
          items.push(value);
          itemsMap[value.key] = value;
        }
      });

      if (items.length === 0) {
        res.json({ data: items });
        return;
      }

      /* Get da payments */
      cashew_db.view('app', 'payments', {startkey: start, endkey: end}, function(err, body) {
        if (err) {
          res.status(500).json({ msg: 'error: could not get payments', data: err});
          return;
        }

        var lastPayable = null;

        console.log('* Retrieved payments: ' + body.rows.length);
        body.rows.forEach(function(row) {
          if (lastPayable === null || lastPayable.key !== row.value.payable.key) {
            lastPayable = itemsMap[row.value.payable.key];
            lastPayable.payments = [];
          }
          lastPayable.payments.unshift(row.value);
        });

        res.json({ data: items });
      });
    });
  });

  app.get('/api/get/line-items', function(req, res) {
    /*console.log('GET');*/
    cashew_db.view('app', 'line-items', function(err, body) {
      if (err) {
        res.status(500).json({ msg: 'error: could not get line items', data: err});
        return;
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
    /*console.log('PUT ' + item.name);*/
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
    /*console.log('DELETE ' + req.params.id + ' ' + req.params.rev);*/
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

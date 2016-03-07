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

  var createFilterFromMoments = function(momentFrom, momentTo) {
    var result;
    if (!momentFrom && !momentTo) {
      return null;
    }
    result = {};
    if (momentFrom) {
      result.startkey = [momentFrom.year(), momentFrom.month()+1, momentFrom.date(), null];
    } else {
      result.startkey = [null];
    }
    if (momentTo) {
      result.endkey = [momentTo.year(), momentTo.month()+1, momentTo.date(), {}];
    } else {
      result.endkey = [{}];
    }
    return result;
  };

  app.use(express.static('app'));

  app.get('/hello', function(req, res) {
    res.send('world!');
  });

  app.put('/api/pay', jsonParser, function(req, res) {
    var payment = req.body;
    if (!payment) {
      return res.status(400).json({ msg: 'error: no body' });
    } else if (!payment.doctype || payment.doctype !== 'payment') {
      return res.status(400).json({ msg: 'error: expected doctype=payment' });
    }
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
    cashew_db.view('app', 'payables', function(err, body) {
      var from, to, items, itemsMap;

      if (err) {
        res.status(500).json({ msg: 'error: could not get payables', data: err});
        return;
      }

      items = [];
      itemsMap = {};

      /*console.log('* Retrieved payables: ' + body.rows.length);*/
      body.rows.forEach(function(row) {
        var value = row.value;
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
      from = moment.unix(req.params.from).add(-12, 'months');
      to = moment.unix(req.params.to);

      cashew_db.view('app', 'payments', createFilterFromMoments(from, to), function(err, body) {
        if (err) {
          res.status(500).json({ msg: 'error: could not get payments', data: err});
          return;
        }

        /*console.log('* Retrieved payments: ' + body.rows.length);*/
        body.rows.forEach(function(row) {
          var payment = row.value;
          var payable = itemsMap[payment.key];
          if (!payable) {
            console.log('No payable found with key: ' + payment.key);
            return;
          }
          if (!payable.payments) {
            payable.payments = [];
          }
          payable.payments.unshift(payment);
          if (payment.payableInstance) {
            payable = itemsMap[payment.payableInstance.key];
            if (!payable.payments) {
              payable.payments = [];
            }
            payable.payments.unshift(payment);
          }
        });

        res.json({ data: items });
      });
    });
  });

  app.get('/api/get/payments/:from', function(req, res) {
    var from = moment.unix(req.params.from);
    cashew_db.view('app', 'payments', createFilterFromMoments(from), function(err, body) {
      if (err) {
        res.status(500).json({ msg: 'error: could not get payments', data: err});
        return;
      }

      var items = [];
      body.rows.forEach(function(row) {
        items.push(row.value);
      });

      res.json({ data: items });
    });
  });

  app.get('/api/get/line-items/:from', function(req, res) {
    var from = moment.unix(req.params.from).add(1, 'seconds').unix();
    /*console.log('GET from: ' + from);*/
    cashew_db.view('app', 'line-items', {startkey: [from, null, null]}, function(err, body) {
      if (err) {
        res.status(500).json({ msg: 'error: could not get line items', data: err});
        return;
      }
      var items = [];
      body.rows.forEach(function(row) {
        /* console.log('   GOT: ' + row.value.name); */
        items.push(row.value);
      });
      res.json({ data: items });
    });
  });

  app.put('/api/put/line-item', jsonParser, function(req, res) {
    var item = req.body;
    if (!item) {
      return res.status(400).json({ msg: 'error: no body' });
    } else if (!item.doctype || item.doctype !== 'lineitem') {
      return res.status(400).json({ msg: 'error: expected doctype=lineitem' });
    }
    /* console.log('PUT ' + item.name); */
    cashew_db.insert(item, function(err, body) {
      if (err) {
        res.status(500).json({ msg: 'error: save failed', data: err });
        return;
      }
      /*console.log('   SUCCESS ' + item.name);*/
      res.json({ msg: 'inserted', data: body });
    });
  });

  app.put('/api/update/line-item', jsonParser, function(req, res) {
    var item = req.body;
    if (!item) {
      return res.status(400).json({msg: 'error: no body'});
    } else if (!item._id || !item._rev) {
      return res.status(400).json({msg: 'expected _id (' + item._id + ') and _rev (' + item._rev + ') fields'});
    }
    /* console.log('UPDATE ' + item.name); */
    cashew_db.insert(item, function(err) {
      if (err) {
        res.status(500).json({msg: 'error: update failed', data: err});
        return;
      }
      /*console.log('   SUCCESS ' + item.name);*/
      res.json({ msg: 'updated' });
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

  var dbname = process.argv.find(function(item) { return /^--dbname=[a-zA-Z_]+$/.test(item); });

  if (dbname) {
    dbname = dbname.split('=')[1];
    cashew_db = nano.db.use(dbname);
    console.log("* using cashew_db=" + dbname + "\n");
  }

  var server = app.listen(PORT, function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log('* cashew listening at http://%s:%s', host, port);
  });
}());

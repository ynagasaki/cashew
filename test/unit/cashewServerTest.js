'use strict';

(function() {
  var assert = require('assert');
  var UTILS = require('../../cashew-utils.js');
  var moment = require('moment');

  describe('cashew server', function() {
    var LINEITEMS = [
      { doctype: 'lineitem', name: '(test-1)', type: 'minus', amount: 123, freq: {per: 'mo', on: [{D: 15}]} },
      { doctype: 'lineitem', name: '(test-2)', type: 'minus', amount: 234, freq: {per: 'mo', on: [{D: 16}]} },
      { doctype: 'lineitem', name: '(test-3)', type: 'minus', amount: 345, freq: {per: 'yr', on: [{M: 5, D: 23}], split: true} },
      { doctype: 'lineitem', name: '(test-4)', type: 'minus', amount: 111, freq: {per: 'mo', on: [{D: 17}]}, endDate: moment('1990-01-01').unix() }
    ];
    var PAYMENTS = [
      [
        { doctype: 'payment', year: 2016, month: 1, day: 15},
        { doctype: 'payment', year: 2016, month: 2, day: 15}
      ],
      [
        { doctype: 'payment', year: 2016, month: 3, day: 16}
      ],
      [],
      []
    ];
    var matchRetrievedByName = function(retrieved) {
      /* Aww yeah, n^2 */
      retrieved.forEach(function(actual) {
        LINEITEMS.forEach(function(expected) {
          if (actual.name === expected.name) {
            expected.retrieved = actual;
          }
        });
      });
    };
    var itemToString = function(i, item) {
      var delim = '\t';
      return i + delim + JSON.stringify(item);
    };
    var sequentialInsert = function(path, data, i, success, done) {
      if (i === data.length) {
        return done;
      }
      return function() {
        var datum = data[i];
        UTILS.requestJson('put', path, datum, function(res) {
          datum.id = res.data.id;
          datum.rev = res.data.rev;
          /*console.log('    * put ' + itemToString(i, datum));*/
          if (success) {
            success(i, datum);
          }
          sequentialInsert(path, data, i + 1, success, done)();
        }, function(res) { console.error('    * failed to put item-' + i); });
      };
    };
    var sequentialDelete = function(data, i, done) {
      if (i === data.length) {
        return done;
      }
      return function() {
        var item = data[i];
        UTILS.request('delete', 'api/delete/' + item.id + '/' + item.rev, function(result) {
          /*console.log('    * del ' + itemToString(i, item));*/
          sequentialDelete(data, i + 1, done)();
        }, function(res) { console.error('    * failed to delete ' + itemToString(i, item)); });
      };
    }

    before(function(done) {
      /*console.log('  * before:');*/
      var success = function(i, datum) {
        PAYMENTS[i].forEach(function(payment) {
          payment.amount = datum.amount;
          payment.key = [datum.id, 'MO', datum.freq.on[0].D, null].join('_');
        });
      };
      var insertPayments = function() {
        sequentialInsert('api/pay', [].concat.apply([], PAYMENTS), 0, UTILS.NOOP(), done)();
      };
      sequentialInsert('api/put/line-item', LINEITEMS, 0, success, insertPayments)();
    });

    after(function(done) {
      /*console.log('  * after:');*/
      var deletePayments = function() {
        sequentialDelete([].concat.apply([], PAYMENTS), 0, done)();
      };
      sequentialDelete(LINEITEMS, 0, deletePayments)();
    });

    afterEach(function() {
      LINEITEMS.forEach(function(item) {
        if (item.retrieved) {
          delete item.retrieved;
        }
      });
    });

    it('should get the test line item(s), except closed ones', function(done) {
      var lineItemCutoffDate = moment();
      UTILS.request('get', 'api/get/line-items/' + lineItemCutoffDate.unix(), function(result) {
        var numClosed = 0;

        LINEITEMS.forEach(function(item) {
          if (item.endDate && lineItemCutoffDate.isAfter(moment.unix(item.endDate))) {
            numClosed ++;
          }
        });

        assert.equal(result.data.length, LINEITEMS.length - numClosed);

        matchRetrievedByName(result.data);

        LINEITEMS.forEach(function(item) {
          if (item.endDate && lineItemCutoffDate.isAfter(moment.unix(item.endDate))) {
            return;
          }
          assert(item.retrieved, 'Expected test line-item "' + item.name + '" to be retrieved.');
          assert.equal(item.retrieved.type, item.type);
          assert.equal(item.retrieved.amount, item.amount);
          assert.equal(item.retrieved.doctype, 'lineitem');
        });

        done();
      }, function() {
        assert.fail();
        done();
      });
    });

    it('should not get closed item on the date it was closed', function(done) {
      var lineItemCutoffDate = moment('1990-01-01');
      UTILS.request('get', 'api/get/line-items/' + lineItemCutoffDate.unix(), function(result) {
        var theClosedItemAccordingToCutoffDate = 0;

        LINEITEMS.forEach(function(item) {
          if (item.endDate && lineItemCutoffDate.isSame(moment.unix(item.endDate))) {
            theClosedItemAccordingToCutoffDate ++;
          }
        });

        assert.equal(result.data.length, LINEITEMS.length - theClosedItemAccordingToCutoffDate);
        done();
      }, function() {
        assert.fail();
        done();
      });
    });

    it('should retrieve payables with correct payments (desc)', function(done) {
      var from = moment('2016-01-01');
      var to = moment('2016-04-01');
      UTILS.request('get', 'api/get/payables/' + from.unix() + '/' + to.unix(), function(result) {
        var itemIdx = 0;
        var item = result.data[itemIdx];
        assert.equal(item.name, '(test-1)');
        assert.equal(item.amount, 123);
        assert.equal(item.doctype, 'payable');
        assert.equal(item.subtype, 'monthly');
        assert.equal(item.payments.length, PAYMENTS[itemIdx].length);
        assert.equal(item.payments[0].year, 2016);
        assert.equal(item.payments[0].month, 2);
        assert.equal(item.payments[0].day, 15);
        assert.equal(item.payments[0].amount, 123);
        assert.equal(item.payments[1].year, 2016);
        assert.equal(item.payments[1].month, 1);
        assert.equal(item.payments[1].day, 15);
        assert.equal(item.payments[1].amount, 123);

        itemIdx = 1;
        item = result.data[itemIdx];
        assert.equal(item.name, '(test-2)');
        assert.equal(item.amount, 234);
        assert.equal(item.doctype, 'payable');
        assert.equal(item.subtype, 'monthly');
        assert.equal(item.payments.length, PAYMENTS[itemIdx].length);
        assert.equal(item.payments[0].year, 2016);
        assert.equal(item.payments[0].month, 3);
        assert.equal(item.payments[0].day, 16);
        assert.equal(item.payments[0].amount, 234);

        done();
      }, function() {
        assert.fail();
        done();
      });
    });

    it('should not retrieve payable payments outside of date range', function(done) {
      var from = moment('2016-01-01');
      var to = moment('2016-03-01');
      UTILS.request('get', 'api/get/payables/' + from.unix() + '/' + to.unix(), function(result) {
        var itemIdx = 0;
        var item = result.data[itemIdx];
        assert.equal(item.name, '(test-1)');
        assert.equal(item.amount, 123);
        assert.equal(item.doctype, 'payable');
        assert.equal(item.subtype, 'monthly');
        assert.equal(item.payments.length, PAYMENTS[itemIdx].length);
        assert.equal(item.payments[0].year, 2016);
        assert.equal(item.payments[0].month, 2);
        assert.equal(item.payments[0].day, 15);
        assert.equal(item.payments[0].amount, 123);
        assert.equal(item.payments[1].year, 2016);
        assert.equal(item.payments[1].month, 1);
        assert.equal(item.payments[1].day, 15);
        assert.equal(item.payments[1].amount, 123);

        itemIdx = 1;
        item = result.data[itemIdx];
        assert.equal(item.name, '(test-2)');
        assert.equal(item.amount, 234);
        assert.equal(item.doctype, 'payable');
        assert.equal(item.subtype, 'monthly');
        assert(!item.payments, 'payments array should not exist');

        done();
      }, function() {
        assert.fail();
        done();
      });
    });

    it('should give monthly payable keys format: "<line item ID>_MO_<day>_"', function(done) {
      var from = moment('2016-01-01');
      var to = moment('2016-01-30');
      UTILS.request('get', 'api/get/payables/' + from.unix() + '/' + to.unix(), function(result) {
        var item = result.data[0];
        assert.equal(item.name, '(test-1)');
        assert.equal(item.amount, 123);
        assert.equal(item.doctype, 'payable');
        assert.equal(item.subtype, 'monthly');
        assert.equal(item.key, [LINEITEMS[0].id, 'MO', 15, null].join('_'));

        done();
      }, function() {
        assert.fail();
        done();
      });
    });

    it('should give yearly payable keys format: "<line item ID>_YR_<day>_<month>"', function(done) {
      var from = moment('2016-01-01');
      var to = moment('2016-01-30');
      UTILS.request('get', 'api/get/payables/' + from.unix() + '/' + to.unix(), function(result) {
        var item = null;
        result.data.forEach(function(datum) {
          if (item === null && datum.subtype === 'yearly') {
            item = datum;
          }
        });
        assert(item, 'expected a "yearly" payable');
        assert.equal(item.name, '(test-3)');
        assert.equal(item.amount, 345);
        assert.equal(item.doctype, 'payable');
        assert.equal(item.key, [LINEITEMS[2].id, 'YR', 23, 5].join('_'));

        done();
      }, function() {
        assert.fail();
        done();
      });
    });

    it('should give set-aside payable keys format: "<line item ID>_SA_<orig day>_<orig month>"', function(done) {
      var from = moment('2016-01-01');
      var to = moment('2016-01-30');
      UTILS.request('get', 'api/get/payables/' + from.unix() + '/' + to.unix(), function(result) {
        var item = null;
        result.data.forEach(function(datum) {
          if (item === null && datum.subtype === 'setaside') {
            item = datum;
          }
        });
        assert(item, 'expected a "setaside" payable');
        assert.equal(item.original.name, '(test-3)');
        assert.equal(item.amount, Math.round(345 / 12));
        assert.equal(item.doctype, 'payable');
        assert.equal(item.key, [LINEITEMS[2].id, 'SA', 23, 5].join('_'));

        done();
      }, function() {
        assert.fail();
        done();
      });
    });

    it('should reject payments that don\'t have doctype=payment set', function(done) {
      UTILS.requestJson('put', 'api/pay', {}, function(res) {
        assert(res.msg, 'expected a message');
        assert.equal(res.msg, 'error: expected doctype=payment');
        done();
      }, function() {
        assert.fail();
        done();
      });
    });

    it('should reject line-items that don\'t have doctype=lineitem set', function(done) {
      UTILS.requestJson('put', 'api/put/line-item', {}, function(res) {
        assert(res.msg, 'expected a message');
        assert.equal(res.msg, 'error: expected doctype=lineitem');
        done();
      }, function() {
        assert.fail();
        done();
      });
    });

    it('should reject updating line-items that don\'t have _id and _rev set', function(done) {
      UTILS.requestJson('put', 'api/update/line-item', {}, function(res) {
        assert(res.msg, 'expected a message');
        assert.equal(res.msg, 'expected _id (undefined) and _rev (undefined) fields');
        done();
      }, function() {
        assert.fail();
        done();
      });
    });

    it('should only get payments within date range', function(done) {
      var from = moment('2016-02-01');
      UTILS.request('get', 'api/get/payments/' + from.unix(), function(result) {
        var actual, expected;

        assert.equal(result.data.length, 2);

        actual = result.data[0];
        expected = PAYMENTS[0][1];
        assert.equal(actual.year, expected.year);
        assert.equal(actual.month, expected.month);
        assert.equal(actual.day, expected.day);

        actual = result.data[1];
        expected = PAYMENTS[1][0];
        assert.equal(actual.year, expected.year);
        assert.equal(actual.month, expected.month);
        assert.equal(actual.day, expected.day);

        done();
      }, function() {
        assert.fail();
        done();
      });
    });
  });
}());

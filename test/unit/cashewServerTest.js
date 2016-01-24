'use strict';

(function() {
  var assert = require('assert');
  var UTILS = require('../../cashew-utils.js');
  var moment = require('moment');

  describe('cashew server', function() {
    var LINEITEMS = [
      { name: '(test-1)', type: 'minus', amount: 123, freq: {per: 'mo', on: [{D: 15}]} },
      { name: '(test-2)', type: 'minus', amount: 234, freq: {per: 'mo', on: [{D: 16}]} },
      { name: '(test-3)', type: 'minus', amount: 345, freq: {per: 'yr', on: [{M: 5, D: 23}], split: true} }
    ];
    var PAYMENTS = [
      [
        { year: 2016, month: 1, day: 15, payable: null },
        { year: 2016, month: 2, day: 15, payable: null }
      ],
      [
        { year: 2016, month: 3, day: 16, payable: null }
      ],
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
          payment.payable = { name: datum.name, key: [datum.id, datum.freq.on[0].D, null].join('_') };
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

    it('should get the test line item(s)', function(done) {
      UTILS.request('get', 'api/get/line-items', function(result) {
        assert.equal(result.data.length, LINEITEMS.length);

        matchRetrievedByName(result.data);

        LINEITEMS.forEach(function(item) {
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

    it('should give monthly payable keys format: "<line item ID>_<day>_"', function(done) {
      var from = moment('2016-01-01');
      var to = moment('2016-01-30');
      UTILS.request('get', 'api/get/payables/' + from.unix() + '/' + to.unix(), function(result) {
        var item = result.data[0];
        assert.equal(item.name, '(test-1)');
        assert.equal(item.amount, 123);
        assert.equal(item.doctype, 'payable');
        assert.equal(item.subtype, 'monthly');
        assert.equal(item.key, [LINEITEMS[0].id, 15, null].join('_'));

        done();
      }, function() {
        assert.fail();
        done();
      });
    });

    it('should give yearly payable keys format: "<line item ID>_<day>_<month>"', function(done) {
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
        assert.equal(item.key, [LINEITEMS[2].id, 23, 5].join('_'));

        done();
      }, function() {
        assert.fail();
        done();
      });
    });

    it('should give set-aside payable keys format: "<line item ID>__<month>"', function(done) {
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
        assert.equal(item.key, [LINEITEMS[2].id, null, 5].join('_'));

        done();
      }, function() {
        assert.fail();
        done();
      });
    });
  });
})();

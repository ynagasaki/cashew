'use strict';

(function() {
  var assert = require('assert');
  var UTILS = require('../../cashew-utils.js');

  describe('cashew server', function() {
    var RECORDS = [
      { name: '(test-1)', type: 'minus', amount: 123, freq: {per: 'mo', on: [{D: 15}]} },
      { name: '(test-2)', type: 'minus', amount: 234, freq: {per: 'mo', on: [{D: 16}]} }
    ];

    var PAYMENTS = [
      [
        { year: 2016, month: 1, day: 15, payable: null },
        { year: 2016, month: 2, day: 15, payable: null }
      ],
      [
        { year: 2016, month: 3, day: 16, payable: null }
      ]
    ];

    /* Aww yeah, n^2 */
    var matchRetrievedByName = function(retrieved) {
      retrieved.forEach(function(actual) {
        RECORDS.forEach(function(expected) {
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
          console.log('    * put ' + itemToString(i, datum));
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
          console.log('    * del ' + itemToString(i, item));
          sequentialDelete(data, i + 1, done)();
        }, function(res) { console.error('    * failed to delete ' + itemToString(i, item)); });
      };
    }

    before(function(done) {
      console.log('  * before:');
      var success = function(i, datum) {
        PAYMENTS[i].forEach(function(payment) {
          payment.payable = { name: datum.name, amount: datum.amount, key: [datum.id, datum.freq.on[0].D, null] };
        });
      };
      var insertPayments = function() {
        sequentialInsert('api/pay', [].concat.apply([], PAYMENTS), 0, UTILS.NOOP(), done)();
      };
      sequentialInsert('api/put/line-item', RECORDS, 0, success, insertPayments)();
    });

    after(function(done) {
      console.log('  * after:');
      var deletePayments = function() {
        sequentialDelete([].concat.apply([], PAYMENTS), 0, done)();
      };
      sequentialDelete(RECORDS, 0, deletePayments)();
    });

    it('should get the test line item(s)', function(done) {
      UTILS.request('get', 'api/get/line-items', function(result) {
        assert.equal(result.data.length, RECORDS.length);

        matchRetrievedByName(result.data);

        RECORDS.forEach(function(item) {
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
  });
})();

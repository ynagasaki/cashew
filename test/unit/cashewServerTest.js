'use strict';

(function() {
  var assert = require('assert');
  var UTILS = require('../../cashew-utils.js');

  describe('cashew server', function() {
    var TEST_DATA = [
      {
        name: '(test data) monthly payable 1',
        type: 'minus',
        amount: 123,
        freq: {
          per: 'mo',
          on: [{D: 15}]
        }
      },
      {
        name: '(test data) monthly payable 2',
        type: 'minus',
        amount: 234,
        freq: {
          per: 'mo',
          on: [{D: 16}]
        }
      }
    ];

    var matchRetrievedByName = function(retrieved) {
      retrieved.forEach(function(actual) {
        TEST_DATA.forEach(function(expected) {
          if (actual.name === expected.name) {
            expected.retrieved = actual;
          }
        });
      });
    };

    before(function(done) {
      var last = TEST_DATA[TEST_DATA.length - 1];
      console.log('Running test setup...');
      TEST_DATA.forEach(function(testData) {
        var MAYBE_DONE = (testData == last) ? done : function(){};
        UTILS.requestJson('put', 'api/put/line-item', testData, function(result) {
          testData.id = result.data.id;
          testData.rev = result.data.rev;
          console.log('..' + result.msg + ' ' + testData.id);
          MAYBE_DONE();
        }, function(result) {
          console.error('..failed to insert test data: ' + testData.name);
          MAYBE_DONE();
        });
      });
    });
    
    after(function(done) {
      var last = TEST_DATA[TEST_DATA.length - 1];
      console.log('Running test tear-down...');
      TEST_DATA.forEach(function(testData) {
        var MAYBE_DONE = (testData == last) ? done : function(){};
        UTILS.request('delete', 'api/delete/' + testData.id + '/' + testData.rev, function(result) {
          console.log('..' + result.msg + ' ' + testData.id);
          MAYBE_DONE();
        }, function(result) {
          console.error('..failed to delete test data: ' + testData.name);
          MAYBE_DONE();
        });
      });
    });

    it('should get the test line item(s)', function(done) {
      UTILS.request('get', 'api/get/line-items', function(result) {
        assert.ok(result.data.length >= 1);

        matchRetrievedByName(result.data);

        TEST_DATA.forEach(function(item) {
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

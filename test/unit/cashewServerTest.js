'use strict';

(function() {
  var assert = require('assert');
  var UTILS = require('../../cashew-utils.js');

  describe('cashew server', function() {
    var TEST_DATA = [
      {
        name: '(test data) some monthly payable',
        type: 'minus',
        amount: 123,
        freq: {
          per: 'mo',
          on: [{D: 15}]
        }
      }
    ];

    before(function(done) {
      console.log('Running test setup...');
      TEST_DATA.forEach(function(testData) {
        UTILS.requestJson('put', 'api/put/line-item', testData, function(result) {
          testData.id = result.data.id;
          testData.rev = result.data.rev;
          console.log('..' + result.msg + ' ' + testData.id);
          done();
        }, function(result) {
          console.error('..failed to insert test data: ' + testData.name);
          done();
        });
      });
    });
    
    after(function(done) {
      console.log('Running test tear-down...');
      TEST_DATA.forEach(function(testData) {
        UTILS.request('delete', 'api/delete/' + testData.id + '/' + testData.rev, function(result) {
          console.log('..' + result.msg + ' ' + testData.id);
          done();
        }, function(result) {
          console.error('..failed to delete test data: ' + testData.name);
          done();
        });
      });
    });

    it('should get the test line item(s)', function(done) {
      UTILS.request('get', 'api/get/line-items', function(result) {
        var testItem = null;
        assert.ok(result.data.length >= 1);
        result.data.forEach(function(item) {
          if (item.name === TEST_DATA[0].name) {
            testItem = item;
          }
        });
        assert(testItem, 'Expected test line-item "' + TEST_DATA[0].name + '" to be retrieved.');
        assert.equal(testItem.type, 'minus');
        assert.equal(testItem.amount, 123);
        assert.equal(testItem.doctype, 'lineitem');
        done();
      }, function() {
        assert.fail();
        done();
      });
    });
  });
})();

'use strict';

(function() {
  var assert = require('assert');
  var UTILS = require('../../cashew-utils.js');

  describe('cashew server', function() {
    var testData = null;

    before(function(done) {
      console.log('Running test setup...');
      var data = {
        name: 'TEST-i752975',
        type: 'minus',
        amount: 123,
        freq: {
          per: 'mo',
          on: [{D: 15}]
        }
      };
      UTILS.requestJson('put', 'api/put/line-item', data, function(result) {
        testData = result.data;
        console.log('..' + result.msg + ' ' + testData.id);
        done();
      }, function(result) {
        console.error('..failed to insert test data');
        done();
      });
    });
    
    after(function(done) {
      console.log('Running test tear-down...');
      UTILS.request('delete', 'api/delete/' + testData.id + '/' + testData.rev, function(result) {
        console.log('..' + result.msg + ' ' + testData.id);
        done();
      }, function(result) {
        console.error('..failed to delete test data ' + testData.id);
        done();
      });
    });

    it('should get the test line item(s)', function(done) {
      UTILS.request('get', 'api/get/line-items', function(result) {
        var testItem = null;
        assert.ok(result.data.length >= 1);
        result.data.forEach(function(item) {
          if (item.name === 'TEST-i752975') {
            testItem = item;
          }
        });
        assert(testItem);
        done();
      }, function() {
        assert.fail();
        done();
      });
    });
  });
})();

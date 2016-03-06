'use strict';

(function() {
  angular.module('cashewApp.services')

  .factory('LineItemsService', ['$http', '$rootScope', function($http, $rootScope) {
    var serv = {};

    serv.lineItems = [];

    serv.removeFromLineItems = function(item) {
      var i = 0;
      for (; i < serv.lineItems.length; ++i) {
        if (serv.lineItems[i]._id === item._id) {
          break;
        }
      }
      serv.lineItems.splice(i, 1);
    };

    serv.put = function(item) {
      item.startDate = moment().startOf('day').unix();
      item.doctype = 'lineitem';
      $http.put('/api/put/line-item', item).then(function(result) {
        var payload = result.data.data;
        if (payload.ok) {
          item._id = payload.id;
          item._rev = payload.rev;
          serv.lineItems.push(item);
          $rootScope.$broadcast('lineitems.added');
        }
      }, function(result) {
        console.log('failed to save: ' + result.data.data.message);
      });
    };

    serv.refresh = function(momentFrom) {
      $http.get('/api/get/line-items/' + momentFrom.unix()).then(function(result) {
        if (result.data.data) {
          serv.lineItems = result.data.data;
          $rootScope.$broadcast('lineitems.refreshed');
        }
      }, function(result) {
        console.log('failed to get items: ' + result.data);
      });
    };

    serv.remove = function(item) {
      $http.delete('/api/delete/' + item._id + '/' + item._rev).then(function(result) {
        if (result.data.data.ok) {
          serv.removeFromLineItems(item);
          $rootScope.$broadcast('lineitems.removed');
        }
      }, function(result) {
        console.log('failed to remove: ' + result.data);
      });
    };

    serv.close = function(item) {
      item.endDate = moment().startOf('day').unix();
      $http.put('/api/update/line-item/', item).then(function(result) {
        if (result.data.msg === 'updated') {
          serv.removeFromLineItems(item);
          $rootScope.$broadcast('lineitems.updated');
        }
      }, function(result) {
        console.log('failed to update: ' + result.data.msg);
        delete item.endDate;
      });
    };

    return serv;
  }]);
}());

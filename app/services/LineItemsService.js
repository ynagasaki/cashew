'use strict';

(function() {
  angular.module('cashewApp.services')

  .factory('LineItemsService', ['$http', '$rootScope', function($http, $rootScope) {
    var serv = {};

    serv.lineItems = [];

    serv.put = function(item) {
      var me = this;
      $http.put('/api/put/line-item', item).then(function (result) {
        var payload = result.data.data;
        if (payload.ok) {
          item._id = payload.id;
          item._rev = payload.rev;
          me.lineItems.push(item);
          $rootScope.$broadcast("lineitems.added");
        }
      }, function (result) {
        console.log("failed to save: " + result.data.data.message);
      });
    };

    serv.refresh = function() {
      var me = this;
      $http.get('/api/get/line-items').then(function (result) {
        if (result.data.data) {
          me.lineItems = result.data.data;
          $rootScope.$broadcast("lineitems.refreshed");
        }
      }, function (result) {
        console.log("failed to get items: " + result.data);
      });
    };

    serv.remove = function(item) {
      var me = this;
      $http.delete('/api/delete/' + item._id + '/' + item._rev).then(function (result) {
        if (result.data.data.ok) {
          var i = 0;
          for (; i < me.lineItems.length; ++i) {
            if (me.lineItems[i]._id === item._id) {
              break;
            }
          }
          me.lineItems.splice(i, 1);
          $rootScope.$broadcast("lineitems.removed");
        }
      }, function (result) {
        console.log("failed to remove: " + result.data);
      });
    };
    
    return serv;
  }]);
})();

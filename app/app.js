'use strict';

(function() {
  /* Services */
  angular.module('cashewApp.services', [])

  .factory('LineItemsService', ['$http', '$rootScope', function($http, $rootScope) {
    var serv = {};
    serv.lineItems = [];
    serv.put = function(item) {
      var me = this;
      $http.put('/api/addLineItem', item).then(function (result) {
        if (result.data.data.ok) {
          me.lineItems.push(item);
          $rootScope.$broadcast("lineitems.added");
        }
      }, function (result) {
        console.log("failed to save: " + result.data.data.message);
      });
    };
    serv.refresh = function() {
      var me = this;
      $http.get('/api/getLineItems').then(function (result) {
        if (result.data.data.ok) {
          me.lineItems = result.data.data;
          $rootScope.$broadcast("lineitems.refreshed");
        }
      }, function (result) {
        console.log("failed to get items: " + result.data);
      });
    };
    serv.remove = function(item, idx) {
      var me = this;
      $http.delete('/api/rmLineItem/' + item._id + '/' + item._rev).then(function (result) {
        if (result.data.data.ok) {
          me.lineItems.splice(idx, 1);
          $rootScope.$broadcast("lineitems.removed");
        }
      }, function (result) {
        console.log("failed to remove: " + result.data);
      });
    };
    return serv;
  }]);

  /* App */
  angular.module('cashewApp', [
    'ngRoute',
    'cashewApp.view2',
    'cashewApp.LineItemAdder',
    'cashewApp.LineItemLister',
    'cashewApp.version',
    'cashewApp.services'
  ])

  .config(['$routeProvider', function($routeProvider) {
    $routeProvider.otherwise({redirectTo: '/line-items'});
  }]);

})();

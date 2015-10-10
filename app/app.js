'use strict';

(function() {
  /* Services */
  angular.module('myApp.services', [])

  .factory('LineItemsService', ['$http', '$rootScope', function($http, $rootScope) {
    var serv = {};
    serv.lineItems = [];
    serv.put = function(item) {
      var me = this;
      $http.put('/api/addLineItem', item).then(function (result) {
        console.log("inserted: " + result.data.data.id + ", " + result.data.data.rev);
        me.lineItems.push(item);
        $rootScope.$broadcast("lineitems.added");
      }, function (result) {
        console.log("failed to save: " + result.data.msg + ": " + result.data.data.message);
      });
    };
    serv.refresh = function() {
      var me = this;
      $http.get('/api/getLineItems').then(function (result) {
        me.lineItems = result.data.data;
        $rootScope.$broadcast("lineitems.refreshed");
      }, function (result) {
        console.log("failed to get items: " + result.data);
      });
    };
    return serv;
  }]);

  /* App */
  angular.module('myApp', [
    'ngRoute',
    'myApp.view2',
    'myApp.LineItemAdder',
    'myApp.LineItemLister',
    'myApp.version',
    'myApp.services'
  ])

  .config(['$routeProvider', function($routeProvider) {
    $routeProvider.otherwise({redirectTo: '/line-items'});
  }]);

})();

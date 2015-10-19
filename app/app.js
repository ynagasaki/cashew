'use strict';

(function() {
  angular.module('cashewApp.services', []);

  angular.module('cashewApp', [
    'ngRoute',
    'cashewApp.view2',
    'cashewApp.Dashboard',
    'cashewApp.LineItemAdder',
    'cashewApp.LineItemLister',
    'cashewApp.version',
    'cashewApp.services'
  ])

  .config(['$routeProvider', function($routeProvider) {
    $routeProvider.otherwise({redirectTo: '/line-items'});
  }]);

})();

'use strict';

(function() {
  angular.module('cashewApp.services', []);

  angular.module('cashewApp', [
    'ngRoute',
    'cashewApp.Dashboard',
    'cashewApp.LineItemAdder',
    'cashewApp.Planner',
    'cashewApp.History',
    'cashewApp.version',
    'cashewApp.services'
  ])

  .config(['$routeProvider', function($routeProvider) {
    $routeProvider.otherwise({redirectTo: '/plan'});
  }]);

})();

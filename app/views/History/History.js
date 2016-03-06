'use strict';

(function() {
  var history = angular.module('cashewApp.History', ['ngRoute']);

  history.config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/history', {
      templateUrl: 'views/History/History.html',
      controller: 'HistoryController',
      controllerAs: 'hist'
    });
  }]);

  history.controller('HistoryController', ['$scope', 'PayablesService', function($scope, PayablesService) {
    var me = this;
    console.log(me);
    console.log($scope);
    console.log(PayablesService);
  }]);
})();

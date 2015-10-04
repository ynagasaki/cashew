'use strict';

angular.module('myApp.view1', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/view1', {
    templateUrl: 'view1/view1.html',
    controller: 'View1Ctrl'
  });
}])

.controller('View1Ctrl', ['$scope', function($scope) {
  $scope.lineItems = [
    {
      'name': 'a bill',
      'recurs': true,
      'amount': 52.52,
      'freq': {
        'per': 'mo',
        'on': [12]
      }
    },
    {
      'name': 'a income',
      'recurs': true,
      'amount': 100.01,
      'freq': {
        'per': 'mo',
        'on': [10,25]
      }
    }
  ];
}]);

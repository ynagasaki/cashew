'use strict';

angular.module('myApp.view1', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/view1', {
    templateUrl: 'view1/view1.html',
    controller: 'View1Ctrl',
    controllerAs: 'view1'
  });
}])

.controller('View1Ctrl', ['$scope', function($scope) {
  $scope.justDoingThisToAppeaseJSLint = true;
  this.lineItem = { period: 'mo', dates: [{D:1}] };
  this.addItem = function() {
    this.lineItem.type = this.lineItem.amount < 0 ? 'minus' : 'plus';
    this.lineItem.amount = Math.abs(this.lineItem.amount);
    this.lineItem.recurs = this.lineItem.period === 'once';
    this.lineItems.push(this.lineItem);
    this.lineItem = { period: 'mo', dates: [{D:1}] };
  };
  this.addDateToLineItem = function() {
    var pushme = {D:1};
    if (this.lineItem.period === 'yr') {
      pushme.M = 1;
    }
    this.lineItem.dates.push(pushme);
  };
  this.lineItems = [
    {
      name: 'a bill',
      type: 'minus',
      recurs: true,
      amount: 52.52,
      freq: {
        per: 'mo',
        on: [{D: 12}]
      }
    },
    {
      name: 'a income',
      type: 'plus',
      recurs: true,
      amount: 100.01,
      freq: {
        per: 'mo',
        on: [{D: 10}, {D: 25}]
      }
    }
  ];
}]);

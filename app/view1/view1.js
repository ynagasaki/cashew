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
  $scope.isInvalidDate = function(d) {
    if (d.M) {
      switch (d.M) {
        case 1:
        case 3:
        case 5:
        case 7:
        case 8:
        case 10:
        case 12:
          return d.D === 31;
        case 2:
          return d.D === 28;
        case 4:
        case 6:
        case 9:
        case 11:
          return d.D === 30;
        default:
          return false;
      }
      return !isNaN(d.M) && !isNaN(d.D);
    }
    return !isNaN(d.D);
  };
  this.lineItem = { period: 'mo', dates: [{}] };
  this.addItem = function() {
    this.lineItem.type = this.lineItem.amount < 0 ? 'minus' : 'plus';
    this.lineItem.amount = Math.abs(this.lineItem.amount);
    this.lineItem.recurs = this.lineItem.period === 'once';
    this.lineItems.push(this.lineItem);
    this.lineItem = { period: 'mo', dates: [{}] };
  };
  this.lineItemDatesAllUsed = function() {
    if (this.lineItem.period==='mo') {
      for (var i = 0; i < this.lineItem.dates.length; ++i) {
        var elem = this.lineItem.dates[i];
        if (!elem.D) {
          return false;
        }
      }
    } else if (this.lineItem.period==='yr') {
      for (var i = 0; i < this.lineItem.dates.length; ++i) {
        var elem = this.lineItem.dates[i];
        if (!elem.D || !elem.M) {
          return false;
        }
      }
    }
    return true;
  }
  this.addDateToLineItem = function() {
    this.lineItem.dates.push({});
  };
  this.inputProblems = function() {
    var result = [];
    if (!this.lineItem.name || !this.lineItem.name.toString().trim()) {
      result.push("missing description")
    }
    if (!this.lineItem.amount || this.lineItem.amount===0) {
      result.push("missing amount")
    }
    return result;
  }
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

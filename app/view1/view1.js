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
      switch (parseInt(d.M)) {
        case 1:
        case 3:
        case 5:
        case 7:
        case 8:
        case 10:
        case 12:
          return d.D > 31;
        case 2:
          return d.D > 28;
        case 4:
        case 6:
        case 9:
        case 11:
          return d.D > 30;
        default:
          return false;
      }
      return isNaN(d.M) || isNaN(d.D);
    }
    return isNaN(d.D);
  };
  $scope.validName = function(lineItem) {
    return !lineItem || !lineItem.name || lineItem.name.toString().trim().length > 0;
  }
  $scope.validAmount = function(lineItem) {
    return parseInt(lineItem.amount) !== 0;
  }

  $scope.getErrorMessage = function(item) {
    var dates = [];
    if (!item.name) { return "Please enter a name."; }
    if (!item.amount || parseFloat(item.amount) === 0) { return "Please enter a valid, non-zero amount of money."; }
    if (item.period === 'mo') {
      for (var i in item.dates) {
        var d = item.dates[i];
        if (d.D && !isNaN(d.D) && d.D <= 28) {
          dates.push({D: d.D});
        }
      }
      if (dates.length === 0 || dates.length < item.dates.length) {
        return "Missing or invalid days (only days 1 to 28 are supported).";
      }
    } else if (item.period === 'yr') {
      for (var i in item.dates) {
        var d = item.dates[i];
        if (d.M && !$scope.isInvalidDate(d)) {
          dates.push({D: d.D, M: d.M});
        }
      }
      if (dates.length === 0 || dates.length < item.dates.length) {
        return "Missing or invalid dates.";
      }
    }
    return null;
  }

  this.lineItem = { period: 'mo', dates: [{}] };
  this.addItem = function() {
    this.lineItem.type = this.lineItem.amount < 0 ? 'minus' : 'plus';
    this.lineItem.amount = Math.abs(this.lineItem.amount);
    this.lineItem.recurs = this.lineItem.period === 'once';
    this.lineItems.push(this.lineItem);
    this.lineItem = { period: 'mo', dates: [{}] };
  };
  this.allowAddingDate = function() {
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
        if (!elem.D || !elem.M || $scope.isInvalidDate(elem)) {
          return false;
        }
      }
    }
    return true;
  }
  this.addDateToLineItem = function() {
    this.lineItem.dates.push({});
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

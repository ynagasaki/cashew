'use strict';

angular.module('myApp.view1', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/view1', {
    templateUrl: 'view1/view1.html',
    controller: 'View1Ctrl',
    controllerAs: 'view1'
  });
}])

.controller('View1Ctrl', ['$scope', '$http', function($scope, $http) {
  $scope.isInvalidDate = function(d) {
    if (d.M) {
      if (!d.D) { 
        return true;
      }
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
      return isNaN(d.M) || d.D && isNaN(d.D);
    }
    return d.D && isNaN(d.D);
  };

  $scope.getErrorMessage = function(item) {
    var i, d, dates = [];
    if (!item.name) { return "Please enter a name."; }
    if (!item.amount || parseFloat(item.amount) === 0) { return "Please enter a valid, non-zero amount of money."; }
    if (item.period === 'mo') {
      for (i in item.dates) {
        d = item.dates[i];
        if (d.D && !isNaN(d.D) && d.D <= 28) {
          dates.push({D: d.D});
        }
      }
      if (dates.length === 0 || dates.length < item.dates.length) {
        return "Missing or invalid days (only days 1 to 28 are supported).";
      }
    } else if (item.period === 'yr') {
      for (i in item.dates) {
        d = item.dates[i];
        if (d.M && !$scope.isInvalidDate(d)) {
          dates.push({D: d.D, M: d.M});
        }
      }
      if (dates.length === 0 || dates.length < item.dates.length) {
        return "Missing or invalid dates.";
      }
    }
    return null;
  };

  this.lineItem = { period: 'mo', dates: [{}] };
  this.addItem = function() {
    var item = {};
    var lineItems = this.lineItems;
    
    item.name = this.lineItem.name;
    item.type = this.lineItem.amount < 0 ? 'minus' : 'plus';
    item.amount = Math.abs(this.lineItem.amount);
    item.recurs = this.lineItem.period !== 'once';
    item.freq = {};
    if (item.recurs) {
      item.freq.per = this.lineItem.period;
      item.freq.on = this.lineItem.dates;
    }
    
    $http.put('/api/addLineItem', item).then(function (result) {
      console.log("add success: " + result.data.msg + ": " + result.data.data.rev);
      lineItems.push(item);
    }, function (result) {
      console.log("add failed: " + result.data.msg + ": " + result.data.data.message);
    });

    this.lineItem = { period: 'mo', dates: [{}] };
  };
  this.allowAddingDate = function() {
    var i, elem;
    if (this.lineItem.period==='mo') {
      for (i = 0; i < this.lineItem.dates.length; ++i) {
        elem = this.lineItem.dates[i];
        if (!elem.D) {
          return false;
        }
      }
    } else if (this.lineItem.period==='yr') {
      for (i = 0; i < this.lineItem.dates.length; ++i) {
        elem = this.lineItem.dates[i];
        if (!elem.D || !elem.M || $scope.isInvalidDate(elem)) {
          return false;
        }
      }
    }
    return true;
  };
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

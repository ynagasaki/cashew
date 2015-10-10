'use strict';

(function() {
  angular.module('cashewApp.LineItemAdder', [])

  .directive('lineItemAdder', function() {
    return {
      restrict: 'E',
      templateUrl: 'views/LineItemAdder/LineItemAdder.html',
      controller: 'LineItemAdder',
      controllerAs: 'adder'
    };
  })

  .controller('LineItemAdder', ['$scope', 'LineItemsService', function($scope, LineItemsService) {
    var me = this;

    me.lineItem = { period: 'mo', dates: [{}] };

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
      var i, d, dates = 0;
      if (!item.name) { return "Please enter a name."; }
      if (!item.amount || parseFloat(item.amount) === 0) { return "Please enter a valid, non-zero amount of money."; }
      if (item.period === 'mo') {
        for (i in item.dates) {
          d = item.dates[i];
          if (d.D && !isNaN(d.D) && d.D <= 28) {
            dates++;
          }
        }
        if (dates === 0 || dates < item.dates.length) {
          return "Missing or invalid days (only days 1 to 28 are supported).";
        }
      } else if (item.period === 'yr') {
        for (i in item.dates) {
          d = item.dates[i];
          if (d.M && !$scope.isInvalidDate(d)) {
            dates++;
          }
        }
        if (dates === 0 || dates < item.dates.length) {
          return "Missing or invalid dates.";
        }
      }
      return null;
    };

    me.addItem = function() {
      var item = {};
      
      item.name = me.lineItem.name;
      item.type = me.lineItem.amount < 0 ? 'minus' : 'plus';
      item.amount = Math.abs(me.lineItem.amount);
      item.recurs = me.lineItem.period !== 'once';
      if (item.recurs) {
        item.freq = {};
        item.freq.per = me.lineItem.period;
        item.freq.on = me.lineItem.dates;
        me.lineItem.dates.forEach(function (date) {
          if (date.M) {
            date.M = parseInt(date.M);
          }
        });
      } else {
        item.freq = null;
      }

      LineItemsService.put(item);

      me.lineItem = { period: 'mo', dates: [{}] };
    };

    me.allowAddingDate = function() {
      var i, elem;
      if (me.lineItem.period==='mo') {
        for (i = 0; i < me.lineItem.dates.length; ++i) {
          elem = me.lineItem.dates[i];
          if (!elem.D) {
            return false;
          }
        }
      } else if (me.lineItem.period==='yr') {
        for (i = 0; i < me.lineItem.dates.length; ++i) {
          elem = me.lineItem.dates[i];
          if (!elem.D || !elem.M || $scope.isInvalidDate(elem)) {
            return false;
          }
        }
      }
      return true;
    };

    me.addDateToLineItem = function() {
      me.lineItem.dates.push({});
    };
  }]);
})();

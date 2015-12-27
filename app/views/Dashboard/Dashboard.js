'use strict';

(function() {

  var dashboard = angular.module('cashewApp.Dashboard', ['ngRoute']);

  dashboard.config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/', {
      templateUrl: 'views/Dashboard/Dashboard.html',
      controller: 'DashboardController',
      controllerAs: 'dash'
    });
  }]);

  dashboard.controller('DashboardController', ['$scope', 'PayablesService', function($scope, PayablesService) {
    var me = this;
    var now = null;
    var yesterday = null; /* moment#isBetween is exclusive :\ */
    var aMonthLater = null;
    var aMonthLaterNextDay = null;

    me.asides = [];
    me.payables = [];

    me.setPeriod = function(val) {
      now = moment(val).startOf('day');
      yesterday = moment(now).add(-1, 'days');
      aMonthLater = moment(now).add(1, 'months');
      aMonthLaterNextDay = moment(aMonthLater).add(1, 'days');
    };
    me.getMonthlyPayableDueDate = function(payable) {
      var candidate1 = moment(now).date(payable.day);
      if (candidate1.isBetween(yesterday, aMonthLater)) {
        return candidate1;
      }
      return moment(aMonthLater).date(payable.day);
    };
    me.getYearlyPayableDueDate = function(payable) {
      var candidate1 = moment(now).month(payable.month - 1).date(payable.day);
      if (candidate1.isBefore(now)) {
        candidate1.add(1, 'years');
      }
      return candidate1;
    };
    me.getSetAsideOriginalPayableDueDate = function(payable) {
      var originalDueDate = me.getYearlyPayableDueDate(payable.original);
      if (originalDueDate.isBefore(aMonthLaterNextDay)) {
        originalDueDate.add(1, 'years');
      }
      return originalDueDate;
    };
    me.payablesOn = function(date) {
      var result = [];
      me.payables.forEach(function(item) {
        if (item.dueDate && item.dueDate.isSame(date)) {
          result.push(item);
        }
      });
      return result;
    };
    me.isToday = function(date) {
      return now.isSame(date, 'day');
    };
    me.isOutOfRange = function(date) {
      return now.isAfter(date) || aMonthLater.isBefore(date);
    };
    me.updatePayables = function () {
      PayablesService.payables.forEach(function(item) {
        if (item.subtype === 'setaside') {
          item.original.dueDate = me.getSetAsideOriginalPayableDueDate(item);
          me.asides.push(item); 
        } else if (item.subtype === 'monthly') {
          item.dueDate = me.getMonthlyPayableDueDate(item);
        } else {
          item.dueDate = me.getYearlyPayableDueDate(item);
        }
        if (item.dueDate && item.dueDate.isBetween(yesterday, aMonthLater)) {
          me.payables.push(item);
        }
      });
    };
    me.togglePaid = function(payable) {
      console.warn(payable.name + " is not being used.");
    };
    me.getPercentComplete = function(aside) {
      console.warn(aside.name + " is not being used.");
      return 0.0;
    };
    me.getItemAmount = function(item) {
      return item.amount;
    };

    $scope.$on('payables.refreshed', me.updatePayables);

    me.setPeriod(moment('2016-02-28'));

    me.datesArray = (function() {
      var start = moment(now).startOf('week');
      var end = moment(now).add(1, 'months').endOf('week');
      var result = [];
      var week = [];
      while (start.isBefore(end)) {
        week.push(moment(start).toDate());
        if (week.length === 7) {
          result.push(week);
          week = [];
        }
        start.add(1, 'days');
      }
      return result;
    })();

    PayablesService.refresh(now, aMonthLater);
  }]);

})();

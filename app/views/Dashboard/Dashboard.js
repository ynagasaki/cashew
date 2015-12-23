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
    var now = moment().startOf('day');
    var aMonthLater = moment(now).add(1, 'months');
    var getMonthlyPayableDueDate = function(payable) {
      var candidate1 = moment(now).date(payable.day);
      if (candidate1.isBetween(now, aMonthLater)) {
        return candidate1;
      }
      return moment(aMonthLater).date(payable.day);
    };
    var getYearlyPayableDueDate = function(payable) {
      var candidate1 = moment(now).month(payable.month - 1).date(payable.day);
      if (candidate1.isBetween(now, aMonthLater)) {
        return candidate1;
      }
      return moment(aMonthLater).month(payable.month - 1).date(payable.day);
    };

    me.asides = [];
    me.payables = [];
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
          // Figure out how to assign dueDate here
          me.asides.push(item); 
        } else {
          if (item.subtype === 'monthly') {
            item.dueDate = getMonthlyPayableDueDate(item);
          } else {
            item.dueDate = getYearlyPayableDueDate(item);
          }
          me.payables.push(item);
        }
      });
    };
    me.togglePaid = function(payable) {
    };
    me.getPercentComplete = function(aside) {
      return 0.0;
    };
    me.getItemAmount = function(item) {
      return item.amount;
    };

    $scope.$on('payables.refreshed', me.updatePayables);

    PayablesService.refresh(now, aMonthLater);
  }]);

})();

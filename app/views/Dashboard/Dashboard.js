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
    var now = new Date();
    var currDay = now.getDate();
    var currMonth = now.getMonth();
    var nextMonth = (currMonth + 1) % 12;
    var monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December"
    ];

    me.payables = [];
    me.datesArray = (function(start, weeks) {
      var offset = start.getDay();
      var d = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0);
      d.setDate(d.getDate() - offset);
      var arr = [];
      var days, week, next;
      while(weeks-- > 0) {
        days = 7;
        week = [];
        while(days-- > 0) {
          week.push(d);
          next = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
          next.setDate(d.getDate() + 1);
          d = next;
        }
        arr.push(week);
      }
      return arr;
    })(new Date(), 5);

    me.payablesOn = function(d) {
      var result = [];
      me.payables.forEach(function(p) {
        if(p.day === d.getDate()) {
          result.push(p);
        }
      });
      return result;
    };
    me.isToday = function(date) {
      var today = new Date();
      return today.getDate() === date.getDate() && today.getMonth() === date.getMonth() && today.getFullYear() === date.getFullYear();
    };
    me.getMonthName = function(mo) {
      return monthNames[mo];
    };

    me.updatePayables = function () {
      PayablesService.payables.forEach(function(item) {
        me.payables.push({ 
          name: item.name,
          amount: item.amount,
          day: item.day,
          month: (item.day >= currDay) ? currMonth : nextMonth,
          paid: false
        });
      });
    };

    $scope.$on('payables.refreshed', me.updatePayables);

    PayablesService.refresh();
  }]);

})();

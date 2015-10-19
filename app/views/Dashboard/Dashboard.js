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
        if(p.day === d.getDate() && p.month === d.getMonth() && p.year === d.getFullYear()) {
          result.push(p);
        }
      });
      return result;
    };
    me.isToday = function(date) {
      return currDay === date.getDate() && currMonth === date.getMonth() && now.getFullYear() === date.getFullYear();
    };
    me.getMonthName = function(mo) {
      return monthNames[mo];
    };
    me.isOutOfRange = function(date) {
      var mo = date.getMonth();
      var dt = date.getDate();
      return (mo > currMonth && dt >= currDay) || (mo <= currMonth && dt < currDay);
    };
    me.updatePayables = function () {
      PayablesService.payables.forEach(function(item) {
        me.payables.push({ 
          lineitem_id: item.lineitem_id,
          name: item.name,
          amount: item.amount,
          day: item.day,
          month: (item.day >= currDay) ? currMonth : nextMonth,
          year: (nextMonth === 0) ? now.getFullYear() + 1 : now.getFullYear(),
          payment: (!item.payment) ? null : item.payment
        });
      });
    };
    me.pay = function(payable) {
      PayablesService.pay(payable);
    };

    $scope.$on('payables.refreshed', me.updatePayables);

    PayablesService.refresh();
  }]);

})();

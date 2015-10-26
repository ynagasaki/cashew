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
    var currJsMonth = now.getMonth();
    var nextJsMonth = (currJsMonth + 1) % 12;
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

    me.asides = [];
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
      var date = d.getDate();
      var month = d.getMonth() + 1;
      var year = d.getFullYear();
      me.payables.forEach(function(p) {
        if(p.day === date && p.month === month && p.year === year) {
          result.push(p);
        }
      });
      return result;
    };
    me.isToday = function(date) {
      return currDay === date.getDate() && currJsMonth === date.getMonth() && now.getFullYear() === date.getFullYear();
    };
    me.getMonthName = function(item) {
      return monthNames[item.month - 1];
    };
    me.isOutOfRange = function(date) {
      var mo = date.getMonth();
      var dt = date.getDate();
      return (mo > currJsMonth && dt >= currDay) || (mo <= currJsMonth && dt < currDay);
    };
    me.updatePayables = function () {
      PayablesService.payables.forEach(function(item) {
        /* Yearly payables not due this month or next will be considered for "set-aside" logic and not added to upcoming payables. */
        if (item.month) {
          var itemJsMonth = item.month - 1;
          if (itemJsMonth !== currJsMonth && itemJsMonth !== nextJsMonth) {
            me.calculateSetAside(item);
            return;
          }
        }
        me.payables.push({
          lineitem_id: item.lineitem_id,
          name: item.name,
          amount: item.amount,
          day: item.day,
          month: (item.month) ? item.month : ((item.day >= currDay) ? currJsMonth : nextJsMonth) + 1,
          year: (nextJsMonth === 0) ? now.getFullYear() + 1 : now.getFullYear(),
          payment: (!item.payment) ? null : item.payment
        });
      });
    };
    me.calculateSetAside = function(item) {
      me.asides.push({
        name: item.name,
        amount: item.amount / 12,
        day: item.day,
        month: item.month
      });
    };
    me.togglePaid = function(payable) {
      if (!payable.payment) {
        PayablesService.pay(payable);
      } else {
        PayablesService.unpay(payable);
      }
    };

    $scope.$on('payables.refreshed', me.updatePayables);

    PayablesService.refresh();
  }]);

})();

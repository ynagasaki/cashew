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
    var now = new Date(2016,0,1,0,0,0,0);
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
    })(now, 5);

    /* Determines the intended pay/due month for the passed payable item */
    me.getPayableMonth = function(item) {
      return ((item.day >= currDay) ? currJsMonth : nextJsMonth) + 1;
    }
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
        if (item.month) {
          /* yearly payable logic */
          var itemJsMonth = item.month - 1;
          if (itemJsMonth !== currJsMonth && itemJsMonth !== nextJsMonth) {
            /* if not due this month or next month, then consider for "set-aside" logic */
            me.calculateSetAside(item);
            /* and don't add to upcoming payables list */
            return;
          }
        }
        var payableMonth = me.getPayableMonth(item);
        me.payables.push({
          lineitem_id: item.lineitem_id,
          name: item.name,
          amount: item.amount,
          day: item.day,
          month: payableMonth,
          year: (nextJsMonth === 0) ? now.getFullYear() + 1 : now.getFullYear(),
          payment: (!item.payment || item.payment.month !== payableMonth) ? null : item.payment
        });
      });
    };
    me.calculateSetAside = function(item) {
      var no_payments = !item.payments || item.payments.length === 0;
      me.asides.push({
        lineitem_id: item.lineitem_id,
        name: item.name,
        amount: item.amount / 12,
        month: me.getPayableMonth(item),
        year: (nextJsMonth === 0) ? now.getFullYear() + 1 : now.getFullYear(),
        payments: no_payments ? null : item.payments,
        payment: no_payments ? null : item.payments[0]
      });
    };
    me.togglePaid = function(payable) {
      if (!payable.payment) {
        PayablesService.pay(payable);
      } else {
        PayablesService.unpay(payable);
      }
    };
    me.togglePaidAside = function(aside) {
      if (!aside.payments) {
        aside.payments = [];
      }
      if (!aside.payment) {
        PayablesService.pay(aside, function(payable) {
          if (payable.payment) {
            payable.payments.unshift(payable.payment);
          }
        });
      } else {
        PayablesService.unpay(aside, function(payable) {
          if (payable.payment === null) {
            payable.payments.shift();
          }
        });
      }
    };
    me.getPercentComplete = function(aside) {
      if (!aside.payments || aside.payments.length === 0) {
        return 0.0;
      }
      var sum = 0;
      var total = aside.amount * 12;
      aside.payments.forEach(function(elem) {
        sum += elem.amount;
      });
      return parseInt(sum / total * 100);
    };

    $scope.$on('payables.refreshed', me.updatePayables);

    PayablesService.refresh();
  }]);

})();

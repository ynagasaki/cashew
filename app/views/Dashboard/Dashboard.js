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
    var currYear = now.getFullYear();
    var nextJsMonth = (currJsMonth + 1) % 12;
    var lastJsMonth = (currJsMonth > 0) ? currJsMonth - 1 : 11;
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

    /* determines intended pay/due month for passed payable */
    me.getPayableMonth = function(item) {
      return ((item.day >= currDay) ? currJsMonth : nextJsMonth) + 1;
    };
    /* determines intended pay/due year for passed payable */
    me.getPayableYear = function(item) {
      return (item.day < currDay && currJsMonth === 11) ? currYear + 1 : currYear;
    };
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
      return currDay === date.getDate() && currJsMonth === date.getMonth() && currYear === date.getFullYear();
    };
    me.getMonthName = function(item) {
      return monthNames[item.month - 1];
    };
    me.isOutOfRange = function(date) {
      var mo = date.getMonth();
      var dt = date.getDate();
      return (mo === nextJsMonth && dt >= currDay) || mo === lastJsMonth || (mo === currJsMonth && dt < currDay);
    };
    me.updatePayables = function () {
      PayablesService.payables.forEach(function(item) {
        var payableMonth = me.getPayableMonth(item);
        var payableYear = me.getPayableYear(item);

        if (item.month) {
          /* yearly payable logic */
          var itemJsMonth = item.month - 1;
          if (itemJsMonth !== currJsMonth) {
            /* if not due this month or next month, then consider for "set-aside" logic */
            me.calculateSetAside(item, payableMonth, payableYear);
            /* and don't add to upcoming payables list */
            return;
          }
        }

        var payable = {
          lineitem_id: item.lineitem_id,
          name: item.name,
          amount: item.amount,
          day: item.day,
          month: payableMonth,
          year: payableYear,
          payment: (!item.payment || item.payment.month !== payableMonth) ? null : item.payment
        };

        if (item.month && item.payments && item.payments.length > 0) {
          payable.payments = [];
          /*TODO: filter out older payments at the DB query level*/
          item.payments.forEach(function(past_payment) {
            if (past_payment.year >= payable.year - 1) {
              payable.payments.push(past_payment);
            }
          });
          /*TODO: these might not be sorted correctly.*/
          if (payable.payments[0].month === payableMonth && payable.payments[0].year === currYear) {
            payable.payment = payable.payments[0];
          }
        }

        me.payables.push(payable);
      });
    };
    me.calculateSetAside = function(item, payableMonth, payableYear) {
      var no_payments = !item.payments || item.payments.length === 0;
      me.asides.push({
        lineitem_id: item.lineitem_id,
        is_aside: true,
        name: item.name,
        amount: item.amount / 12,
        month: payableMonth,
        year: payableYear,
        payments: no_payments ? null : item.payments,
        payment: no_payments || item.payments[0].month !== payableMonth ? null : item.payments[0]
      });
    };
    me.togglePaid = function(payable) {
      if (payable.is_aside && !payable.payments) {
        payable.payments = [];
      }
      if (!payable.payment) {
        PayablesService.pay(payable, function(result) {
          if (result.payment && result.payments) {
            result.payments.unshift(result.payment);
          }
        });
      } else {
        PayablesService.unpay(payable, function(result) {
          if (result.payment === null && result.payments) {
            result.payments.shift();
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
    me.getItemAmount = function(item) {
      /* prefer to show the amount already paid for this period */
      if (item.payment) {
        return item.payment.amount;
      }
      /* if this payable has payments, show remaining amount */
      if (item.payments) {
        var sum = 0;
        item.payments.forEach(function(entry) {
          sum += entry.amount;
        });
        return item.amount - sum;
      }
      /* else just show the original amount */
      return item.amount;
    };

    $scope.$on('payables.refreshed', me.updatePayables);

    PayablesService.refresh();
  }]);

})();

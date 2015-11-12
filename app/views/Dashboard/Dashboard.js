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

    var getMonthlyInstanceMonth = function(item) {
      /* the month for a monthly payable instance is the current month, unless we're showing the next month's instance */
      return ((item.day >= currDay) ? currJsMonth : nextJsMonth) + 1;
    };
    var getMonthlyInstanceYear = function(item) {
      /* the year for a monthly payable instance is the current year, unless we're showing next month's instance and next month is Jan */
      return (item.day < currDay && currJsMonth === 11) ? currYear + 1 : currYear;
    };
    var getYearlyInstanceYear = function(item) {
      /* the year for a yearly payable instance that occurs after this year's instance is of course next year */
      return (item.month && currJsMonth > item.month - 1) ? currYear + 1 : currYear;
    };
    /* NB: getYearlyInstanceMonth is just the yearly payable item's "month" field */
    var determinePayment = function(payable) {
      if (payable.payments && payable.payments[0].month === payable.month && payable.payments[0].year === payable.year) {
        payable.payment = payable.payments[0];
      } else {
        payable.payment = null;
      }
    };

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
      if (item.is_aside) {
        return monthNames[item.orig_month - 1];
      }
      return monthNames[item.month - 1];
    };
    me.isOutOfRange = function(date) {
      var mo = date.getMonth();
      var dt = date.getDate();
      return (mo === nextJsMonth && dt >= currDay) || mo === lastJsMonth || (mo === currJsMonth && dt < currDay);
    };
    me.updatePayables = function () {
      PayablesService.payables.forEach(function(item) {
        var monthlyInstanceMonth = getMonthlyInstanceMonth(item);
        var monthlyInstanceYear = getMonthlyInstanceYear(item);
        var payments;
        /* start by assuming that this is a monthly payable instance */
        var payable = {
          lineitem_id: item.lineitem_id,
          name: item.name,
          amount: item.amount,
          day: item.day,
          month: monthlyInstanceMonth,
          year: monthlyInstanceYear,
          payment: (!item.payment || item.payment.year !== monthlyInstanceYear || item.payment.month !== monthlyInstanceMonth) ? null : item.payment
        };
        /* if this payable is actually yearly... */
        if (item.month) {
          /* correct the instance's due date */
          payable.month = item.month;
          payable.year = getYearlyInstanceYear(item);
          /* gather appropriate payments */
          if (item.payments && item.payments.length > 0) {
            payments = [];
            /*TODO: filter out older payments at the DB query level*/
            item.payments.forEach(function(past_payment) {
              if (past_payment.year === payable.year - 1 && past_payment.month > payable.month || past_payment.year === payable.year && past_payment.month <= payable.month) {
                payments.push(past_payment);
              }
            });
            payable.payments = (payments.length === 0) ? null : payments;
            determinePayment(payable);
          } else {
            payable.payments = null;
            payable.payment = null;
          }
          /* if not due this month, then make a "set-aside" instance */
          if (item.month !== monthlyInstanceMonth) {
            payable.is_aside = true;
            payable.orig_month = payable.month;
            payable.orig_year = payable.year;
            payable.amount = item.amount / 12;
            payable.month = monthlyInstanceMonth;
            payable.year = monthlyInstanceYear;
            determinePayment(payable);
            me.asides.push(payable);
            return;
          }
        }

        me.payables.push(payable);
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

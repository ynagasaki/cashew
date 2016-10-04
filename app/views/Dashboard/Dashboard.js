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

    me.asides = [];
    me.payables = [];
    me.expandedItem = null;

    me.setPeriod = function(val) {
      now = moment(val).startOf('day');
      yesterday = moment(now).add(-1, 'days').endOf('day');
      aMonthLater = moment(now).add(1, 'months');
    };
    me.suggestAmount = function(item) {
      if (item.suggestedAmount) {
        var sugAmt = item.suggestedAmount.toString();
        var len = sugAmt.length - 3;
        var dotPos = sugAmt.indexOf('.');
        while (dotPos > len) {
          sugAmt = sugAmt + '0';
          dotPos --;
        }
        item.inputAmt = sugAmt;
      }
    };
    me.hasValidAmount = function(item) {
      if (!item.amount) {
        return false;
      }
      return me.isValidAmount(item.amount);
    };
    me.isValidAmount = function(amt) {
      if (!amt) {
        return false;
      }
      var parsedAmt = parseFloat(amt);
      return !isNaN(parsedAmt) && parsedAmt > 0;
    };
    me.determinePaymentMade = function(item) {
      var isSetAside = (item.subtype === 'setaside');
      var payments = item.payments;
      var payment;
      var dueYear = item.dueDate.year();
      var dueMonth = item.dueDate.month() + 1;
      var dueDay = item.dueDate.date();
      if (!payments || payments.length === 0) {
        return;
      }
      for (var i = 0, len = payments.length; i < len; ++i) {
        payment = payments[i];
        if (payment.year === dueYear && payment.month === dueMonth && (isSetAside || payment.day === dueDay)) {
          item.payment = payment;
          return;
        }
      }
    };
    me.handleAmountlessItem = function(item) {
      item.isAmountless = true;
      /* populate amount with payment amount if payment was made */
      if (item.payment) {
        item.amount = item.payment.amount;
      }
      /* add a suggested amount that's just the last payment made, if available */
      if (item.payments && item.payments.length > 0) {
        item.suggestedAmount = item.payments[0].amount;
      } else {
        item.suggestedAmount = 0;
      }
    };
    me.calculateRemainingAmount = function(item) {
      var cutoffDate, result;
      if (item.subtype === 'yearly' && item.payments) {
        /* this shouldn't be explicitly nec, since only payments within the last year are retrieved, but do it anyway */
        cutoffDate = moment(item.dueDate).add(-1, 'years');
        result = item.amount;
        for (var i in item.payments) {
          var payment = item.payments[i];
          if (cutoffDate.isBefore([payment.year, payment.month - 1, payment.day])) {
            result -= payment.amount;
          } else {
            break;
          }
        }
        if (result < item.amount) {
          item.remainingAmount = result;
        }
      }
      return result;
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
      return now.isAfter(date) || aMonthLater.isBefore(date) || aMonthLater.isSame(date);
    };
    me.updatePayables = function () {
      PayablesService.payables.forEach(function(item) {
        if (item.subtype === 'setaside') {
          item.original.dueDate = me.getYearlyPayableDueDate(item.original);
          /* only add set-asides if the yearly payable is not in the current period */
          if (item.original.dueDate.isAfter(aMonthLater)) {
            item.dueDate = moment(now).endOf('month');
            me.asides.push(item);
            me.determinePaymentMade(item);
          }
        } else {
          item.dueDate = (item.subtype === 'monthly') ? me.getMonthlyPayableDueDate(item) : me.getYearlyPayableDueDate(item);
          if (item.dueDate && item.dueDate.isBetween(yesterday, aMonthLater)) {
            me.payables.push(item);
            me.determinePaymentMade(item);
            if (me.hasValidAmount(item)) {
              me.calculateRemainingAmount(item);
            } else {
              me.handleAmountlessItem(item);
            }
          }
        }
      });
    };
    me.togglePaid = function(payable) {
      if (!payable.payment) {
        PayablesService.pay(payable);
      } else {
        PayablesService.unpay(payable);
      }
    };
    me.getPercentComplete = function(item) {
      var result = 0;
      var total = item.amount;
      var endDate = item.dueDate;
      var startDate;
      if (item.subtype === 'setaside') {
        total = item.original.amount;
        endDate = item.original.dueDate;
      }
      startDate = moment(endDate).add(-1, 'years');
      if (item.payments) {
        item.payments.forEach(function(payment) {
          if (moment([payment.year, payment.month - 1, payment.day]).isBetween(startDate, endDate)) {
            result += payment.amount;
          }
        });
      }
      return Math.round(result / total * 100);
    };
    me.isExpanded = function(item) {
      return me.expandedItem === item;
    };
    me.expandItem = function(item) {
      if (me.expandedItem !== null) {
        me.expandedItem.inputAmt = null;
      }
      me.expandedItem = item;
      if (item !== null) {
        me.suggestAmount(me.expandedItem);
      }
    };
    me.payAmountlessItem = function(item) {
      if (item.inputAmt) {
        item.amount = parseFloat(item.inputAmt);
        me.togglePaid(item);
        me.expandItem(null);
      }
    };
    me.getNow = function() {
      return now;
    };

    $scope.$on('payables.refreshed', me.updatePayables);

    me.setPeriod(moment());

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

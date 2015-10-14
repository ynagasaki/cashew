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

  dashboard.controller('DashboardController', ['$scope', 'LineItemsService', function($scope, LineItemsService) {
    var me = this;

    var firstDayOfNextMonth = function(date) {
      var nextMonth = (date.getMonth() + 1) % 12;
      return new Date(
        nextMonth === 0 ? date.getFullYear() + 1 : date.getFullYear(),
        nextMonth,
        1,
        0,
        0,
        0,
        0
      );
    };
    var lastDayOfMonth = function(date) {
      var firstDayNextMonth = firstDayOfNextMonth(date);
      return new Date(firstDayNextMonth - 1);
    };
    me.nextMonthCalendarIndexToDayLabel = function(idx) {
      var nextMonthStartDay = nextMonthFirstDate.getDay();
      var result = idx - 1 - nextMonthStartDay;
      if ((result < 0) || (result > 27 && result > lastDayOfMonth(nextMonthFirstDate).getDate() - 1)) {
        return null;
      }
      return (result + 1).toString();
    };

    var nextMonthFirstDate = firstDayOfNextMonth(new Date());

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
    }

    me.nextMonthName = [
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
      "December"][nextMonthFirstDate.getMonth()];

    me.payables = [];

    /* Probably should turn this into a couchdb "view"... SIGH */
    me.updateLineItems = function () {
      LineItemsService.lineItems.forEach(function(item) {
        if (item.type === 'minus' && item.freq.per === 'mo') {
          for (var i = 0; i < item.freq.on.length; ++i) {
            me.payables.push({ 
              name: item.name,
              amount: item.amount,
              day: item.freq.on[i].D
            });
          }
        }
      });
    };

    $scope.$on('lineitems.added', me.updateLineItems);
    $scope.$on('lineitems.refreshed', me.updateLineItems);
    $scope.$on('lineitems.removed', me.updateLineItems);

    LineItemsService.refresh();
  }]);

})();

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

    var nextMonthFirstDate = firstDayOfNextMonth(new Date());

    me.nextMonthCalendarIndexToDayLabel = function(idx) {
      var nextMonthStartDay = nextMonthFirstDate.getDay();
      var result = idx - 1 - nextMonthStartDay;
      if ((result < 0) || (result > 27 && result > lastDayOfMonth(nextMonthFirstDate).getDate() - 1)) {
        return null;
      }
      return (result + 1).toString();
    };

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

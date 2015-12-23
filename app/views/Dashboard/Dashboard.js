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

    me.payablesOn = function(d) {
      var result = [];
      return result;
    };
    me.isToday = function(date) {
      return now.isSame(date, 'day');
    };
    me.getDueDate = function(item) {
      return new Date();
    };
    me.isOutOfRange = function(date) {
      return now.isAfter(date) || aMonthLater.isBefore(date);
    };
    me.updatePayables = function () {
      PayablesService.payables.forEach(function(item) {
        if (item.subtype === 'setaside') {
          me.asides.push(item); 
        } else {
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

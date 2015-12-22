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
    var now = moment();
    var aMonthLater = moment().add(1, "months");

    me.asides = [];
    me.payables = [];
    me.datesArray = [];

    me.payablesOn = function(d) {
      var result = [];
      return result;
    };
    me.isToday = function(date) {
      return false;
    };
    me.getDueDate = function(item) {
      return new Date();
    };
    me.isOutOfRange = function(date) {
      return false;
    };
    me.updatePayables = function () {
      PayablesService.payables.forEach(function(item) {
        me.payables.push(item);
      });
    };
    me.togglePaid = function(payable) {
    };
    me.getPercentComplete = function(aside) {
      return 0.0;
    };
    me.getItemAmount = function(item) {
      return 0.0;
    };

    $scope.$on('payables.refreshed', me.updatePayables);

    PayablesService.refresh(now, aMonthLater);
  }]);

})();

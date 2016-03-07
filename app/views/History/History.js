'use strict';

(function() {
  var history = angular.module('cashewApp.History', ['ngRoute']);

  history.config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/history', {
      templateUrl: 'views/History/History.html',
      controller: 'HistoryController',
      controllerAs: 'hist'
    });
  }]);

  history.controller('HistoryController', ['$scope', 'PaymentsService', function($scope, PaymentsService) {
    var me = this;
    var now = moment().startOf('day');

    me.payments = [];

    me.updatePayments = function() {
      me.payments = PaymentsService.payments;
    };

    $scope.$on('payments.refreshed', me.updatePayments);

    PaymentsService.refresh(moment(now).add(-1, 'years'));
  }]);
}());

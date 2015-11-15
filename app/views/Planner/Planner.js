'use strict';

(function() {
  var planner = angular.module('cashewApp.Planner', ['ngRoute']);

  planner.config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/plan', {
      templateUrl: 'views/Planner/Planner.html',
      controller: 'Planner',
      controllerAs: 'planner'
    });
  }]);

  planner.controller('Planner', ['$scope', 'LineItemsService', function($scope, LineItemsService) {
    var me = this;
    var getMonthlyAmountGraphParts = function(lineItems) {
      var debt_amt = 0;
      var pay_amt = 0;
      var aside_amt = 0;
      var total = 0;
      lineItems.forEach(function(item) {
        if (item.freq.per === 'yr' && item.freq.split) {
          aside_amt += item.amount / 12;
          return;
        }
        if (item.freq.per !== 'mo') {
          return;
        }
        if (item.type === 'minus') {
          debt_amt += item.amount;
        } else if (item.type === 'plus') {
          pay_amt += item.amount;
        }
      });
      total = debt_amt + pay_amt + aside_amt;
      return (total > 0) ? [
        {color: '#FF4747', width: Math.round(debt_amt / total * 100)},
        {color: '#FFDD45', width: Math.round(aside_amt / total * 100)},
        {color: '#A5E85D', width: Math.round(pay_amt / total * 100)}
      ] : [];
    };

    me.lineItems = [];

    me.updateLineItems = function() {
      me.lineItems = LineItemsService.lineItems;
      me.graphParts = getMonthlyAmountGraphParts(me.lineItems);
    };
    me.removeLineItem = function(item) {
      LineItemsService.remove(item);
    };
    me.getPartStyle = function(part) {
      return 'background-color: ' + part.color + '; width: ' + part.width + '%';
    };

    $scope.$on('lineitems.added', me.updateLineItems);
    $scope.$on('lineitems.refreshed', me.updateLineItems);
    $scope.$on('lineitems.removed', me.updateLineItems);

    LineItemsService.refresh();
  }]);
})();

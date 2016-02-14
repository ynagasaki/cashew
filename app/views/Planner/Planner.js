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
      var earn_amt = 0;
      var aside_amt = 0;
      var countedItems = 0;
      lineItems.forEach(function(item) {
        if (!item.amount) {
          return;
        }
        if (item.freq.per === 'yr' && item.type === 'minus' && item.freq.split) {
          aside_amt += item.amount * item.freq.on.length / 12;
          return;
        }
        if (item.freq.per !== 'mo') {
          return;
        }
        if (item.type === 'minus') {
          debt_amt += item.amount * item.freq.on.length;
        } else if (item.type === 'plus') {
          earn_amt += item.amount * item.freq.on.length;
        }
        countedItems ++;
      });
      if (earn_amt > 0) {
        var debt_width = Math.round(debt_amt / earn_amt * 100);
        var aside_width = Math.round(aside_amt / earn_amt * 100);
        var result = [];

        if (debt_amt > 0) {
          result.push({name: 'Monthly payments', color: '#FF4747', width: debt_width});
        }
        if (aside_amt > 0) {
          result.push({name: 'Monthly set-asides', color: '#FFDD45', width: aside_width});
        }
        result.push({name: 'Monthly earnings', color: '#A5E85D', width: 100 - (debt_width + aside_width)});

        return result;
      }
      if (countedItems === 0) {
        return [ {name: 'No data', color: '#EEE', width: 100} ];
      }
      return [ {name: 'All debt :(', color: '#FF4747', width: 100} ];
    };

    me.lineItems = [];

    me.updateLineItems = function() {
      me.lineItems = LineItemsService.lineItems;
      me.graphParts = getMonthlyAmountGraphParts(me.lineItems);
    };
    me.closeLineItem = function(item) {
      LineItemsService.close(item);
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
    $scope.$on('lineitems.updated', me.updateLineItems);

    LineItemsService.refresh(moment().startOf('day'));
  }]);
})();

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
    var getDTIGraphParts = function(lineItems) {
      var debt_amt = {'mo': 0, 'yr': 0};
      var earn_amt = {'mo': 0, 'yr': 0};
      lineItems.forEach(function(item) {
        if (item.isAmountless) {
          return;
        }
        if (item.type === 'minus') {
          debt_amt[item.freq.per] += item.amount * item.freq.on.length;
        } else if (item.type === 'plus') {
          earn_amt[item.freq.per] += item.amount * item.freq.on.length;
        }
      });
      earn_amt.mo *= 12;
      debt_amt.mo *= 12;
      var earn_sum = earn_amt.mo + earn_amt.yr;
      if (earn_sum > 0) {
        var debt_mo_width = Math.round(debt_amt.mo / earn_sum * 100);
        var debt_yr_width = Math.round(debt_amt.yr / earn_sum * 100);
        var result = [];

        if (debt_amt.mo > 0) {
          result.push({name: 'Monthly costs', color: '#FF4747', width: debt_mo_width});
        }
        if (debt_amt.yr > 0) {
          result.push({name: 'Yearly costs', color: '#FFDD45', width: debt_yr_width});
        }
        result.push({name: 'Earnings', color: '#A5E85D', width: 100 - (debt_mo_width + debt_yr_width)});

        return result;
      }
      if (debt_amt.mo + debt_amt.yr === 0) {
        return [ {name: 'No data', color: '#EEE', width: 100} ];
      }
      return [ {name: 'All debt :(', color: '#FF4747', width: 100} ];
    };
    var processLineItems = function(lineItems) {
      lineItems.forEach(function(item) {
        item.isAmountless = !item.amount;
      });
      return lineItems;
    };

    me.lineItems = [];

    me.updateLineItems = function() {
      me.lineItems = processLineItems(LineItemsService.lineItems);
      me.graphParts = getDTIGraphParts(me.lineItems);
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

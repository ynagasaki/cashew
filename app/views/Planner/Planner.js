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

    me.lineItems = [];

    me.updateLineItems = function() {
      me.lineItems = LineItemsService.lineItems;
    };
    me.removeLineItem = function(item) {
      LineItemsService.remove(item);
    };

    $scope.$on('lineitems.added', me.updateLineItems);
    $scope.$on('lineitems.refreshed', me.updateLineItems);
    $scope.$on('lineitems.removed', me.updateLineItems);

    LineItemsService.refresh();
  }]);
})();

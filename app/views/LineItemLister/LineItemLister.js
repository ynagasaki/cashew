'use strict';

(function() {
  var lister = angular.module('cashewApp.LineItemLister', ['ngRoute']);

  lister.config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/line-items', {
      templateUrl: 'views/LineItemLister/LineItemLister.html',
      controller: 'LineItemLister',
      controllerAs: 'lister'
    });
  }]);

  lister.controller('LineItemLister', ['$scope', 'LineItemsService', function($scope, LineItemsService) {
    var me = this;

    me.lineItems = [];

    me.updateLineItems = function () {
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

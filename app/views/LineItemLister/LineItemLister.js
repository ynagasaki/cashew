'use strict';

(function() {
  var lister = angular.module('myApp.LineItemLister', ['ngRoute']);

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

    $scope.$on('lineitems.added', function () {
      me.lineItems = LineItemsService.lineItems;
    });

    $scope.$on('lineitems.refreshed', function () {
      me.lineItems = LineItemsService.lineItems;
    });

    LineItemsService.refresh();
  }]);
})();

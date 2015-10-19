'use strict';

(function() {
  angular.module('cashewApp.services')

  .factory('PayablesService', ['$http', '$rootScope', function($http, $rootScope) {
    var serv = {};

    serv.payables = [];

    serv.refresh = function() {
      $http.get('/api/get/payables').then(function(result) {
        if (result.data.data) {
          serv.payables = result.data.data;
          $rootScope.$broadcast('payables.refreshed');
        }
      }, function(result) {
        console.log('failed to get payables: ' + result.data);
      });
    };

    serv.pay = function(payable) {
      $http.put('/api/pay', payable).then(function(result) {
        var payload = result.data.data;
        if (payload.ok) {
          payable.payment = { id: payload.id, rev: payload.rev };
        } else {
          payable.payment = null;
        }
      }, function(result) {
        console.log('failed to pay ' + payable.name + ': ' + result.data);
        payable.payment = null;
      });
    };

    $rootScope.$on('lineitems.added', serv.refresh);
    $rootScope.$on('lineitems.removed', serv.refresh);

    return serv;
  }]);
})();
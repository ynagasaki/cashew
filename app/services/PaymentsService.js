'use strict';

(function() {
  angular.module('cashewApp.services')

  .factory('PaymentsService', ['$http', '$rootScope', function($http, $rootScope) {
    var serv = {};

    serv.payments = [];

    serv.refresh = function(momentFrom) {
      if (!momentFrom) {
        console.log('momentFrom not specified, NOOP');
        return;
      }
      $http.get('/api/get/payments/' + momentFrom.unix()).then(function(result) {
        if (result.data.data) {
          serv.payments = result.data.data;
          $rootScope.$broadcast('payments.refreshed');
        }
      }, function(result) {
        console.log('failed to get payments: ' + result.data);
      });
    };

    $rootScope.$on('payables.paid', function() { serv.refresh(); });

    return serv;
  }]);
}());

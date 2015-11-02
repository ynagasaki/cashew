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

    serv.pay = function(payable, then) {
      var sum;
      /* Create a payment based on this payable */
      var payment = {};
      payment.lineitem_id = payable.lineitem_id;
      payment.doctype = 'payment';
      payment.day = payable.day;
      payment.month = payable.month;
      payment.year = payable.year;
      payment.amount = payable.amount;
      if (!payable.is_aside && payable.payments) {
        sum = 0;
        payable.payments.forEach(function(entry) {
          sum += entry.amount;
        });
        payment.amount -= sum;
      }
      /* Post payment */
      $http.put('/api/pay', payment).then(function(result) {
        var payload = result.data.data;
        if (payload.ok) {
          payment._id = payload.id;
          payment._rev = payload.rev;
          payable.payment = payment;
        } else {
          payable.payment = null;
          console.log('failed to pay ' + payable.name + ': ' + result.data);
        }
        if (then) {
          then(payable);
        }
      }, function(result) {
        console.log('failed to pay ' + payable.name + ': ' + result.data);
        payable.payment = null;
        if (then) {
          then(payable);
        }
      });
    };

    serv.unpay = function(payable, then) {
      var payment = payable.payment;
      $http.delete('/api/delete/' + payment._id + '/' + payment._rev, payable).then(function(result) {
        var payload = result.data.data;
        if (payload.ok) {
          payable.payment = null;
        }
        if (then) {
          then(payable);
        }
      }, function(result) {
        console.log('failed to unpay ' + payable.name + ': ' + result.data);
        if (then) {
          then(payable);
        }
      });
    };

    $rootScope.$on('lineitems.added', serv.refresh);
    $rootScope.$on('lineitems.removed', serv.refresh);

    return serv;
  }]);
})();

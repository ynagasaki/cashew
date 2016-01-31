'use strict';

(function() {
  angular.module('cashewApp.services')

  .factory('PayablesService', ['$http', '$rootScope', function($http, $rootScope) {
    var serv = {};

    serv.payables = [];

    serv.updatePayments = function(payable, payment) {
      var paymentDate = moment([payment.year, payment.month - 1, payment.day]);
      var i, len = payable.payments.length;
      var currPayment;
      for (i = 0; i < len; i++) {
        currPayment = payable.payments[i];
        if (paymentDate.isAfter([currPayment.year, currPayment.month - 1, currPayment.day])) {
          payable.payments.splice(i, 0, payment);
          return;
        }
      }
    };

    serv.refresh = function(momentFrom, momentTo) {
      $http.get('/api/get/payables/' + momentFrom.unix() + '/' + momentTo.unix()).then(function(result) {
        if (result.data.data) {
          serv.payables = result.data.data;
          $rootScope.$broadcast('payables.refreshed');
        }
      }, function(result) {
        console.log('failed to get payables: ' + result.data);
      });
    };

    serv.pay = function(payable) {
      /* Create a payment based on this payable */
      var dueDate = payable.dueDate;
      var payment = {
        key: payable.key,
        year: dueDate.year(),
        month: dueDate.month() + 1,
        day: dueDate.date(),
        amount: payable.amount
      };
      if (payable.subtype === 'setaside') {
        payment.payableInstance = {
          key: payable.original.key,
          amount: payable.original.amount,
          year: payable.original.dueDate.year(),
          month: payable.original.dueDate.month() + 1,
          day: payable.original.dueDate.date()
        };
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
      }, function(result) {
        console.log('failed to pay ' + payable.name + ': ' + result.data);
        payable.payment = null;
      });
    };

    serv.unpay = function(payable) {
      var payment = payable.payment;
      $http.delete('/api/delete/' + payment._id + '/' + payment._rev, payable).then(function(result) {
        var payload = result.data.data;
        if (payload.ok) {
          payable.payment = null;
        }
      }, function(result) {
        console.log('failed to unpay ' + payable.name + ': ' + result.data);
      });
    };

    $rootScope.$on('lineitems.added', serv.refresh);
    $rootScope.$on('lineitems.removed', serv.refresh);

    return serv;
  }]);
})();

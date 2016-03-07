'use strict';

(function() {
  angular.module('cashewApp.services')

  .factory('PayablesService', ['$http', '$rootScope', function($http, $rootScope) {
    var serv = {};

    serv.payables = [];
    serv.paymentsFrom = null;
    serv.paymentsTo = null;

    serv.addToPayments = function(payable, payment) {
      var paymentDate = moment([payment.year, payment.month - 1, payment.day]);
      var i, len, currPayment;
      if (!payable.payments) {
        payable.payments = [];
        payable.payments.push(payment);
        return;
      }
      len = payable.payments.length;
      for (i = 0; i < len; i++) {
        currPayment = payable.payments[i];
        if (paymentDate.isAfter([currPayment.year, currPayment.month - 1, currPayment.day])) {
          payable.payments.splice(i, 0, payment);
          return;
        }
      }
    };

    serv.removeFromPayments = function(payable, payment) {
      var i, len, currPayment;
      if (!payable.payments) {
        return;
      }
      len = payable.payments.length;
      for (i = 0; i < len; i++) {
        currPayment = payable.payments[i];
        if (currPayment._id === payment._id && currPayment._rev === payment._rev) {
          payable.payments.splice(i, 1);
          return;
        }
      }
    };

    serv.refresh = function(momentFrom, momentTo) {
      if (!momentFrom || !momentTo) {
        momentFrom = serv.paymentsFrom;
        momentTo = serv.paymentsTo;
      } else {
        serv.paymentsFrom = momentFrom;
        serv.paymentsTo = momentTo;
      }
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
        doctype: 'payment',
        key: payable.key,
        year: dueDate.year(),
        month: dueDate.month() + 1,
        day: dueDate.date(),
        amount: (payable.remainingAmount) ? payable.remainingAmount : payable.amount
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
      /* Post payment -- TODO(yoshiyuk): probably move this to PaymentsService */
      $http.put('/api/pay', payment).then(function(result) {
        var payload = result.data.data;
        if (payload.ok) {
          payment._id = payload.id;
          payment._rev = payload.rev;
          payable.payment = payment;
          serv.addToPayments(payable, payment);
          /* not strictly necessary but just in case */
          if (payable.isAmountless) {
            payable.amount = payment.amount;
            payable.suggestedAmount = payment.amount;
          }
          $rootScope.$broadcast('payables.paid');
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
          serv.removeFromPayments(payable, payment);
          payable.payment = null;
          if (payable.isAmountless) {
            payable.amount = null;
            payable.suggestedAmount = null;
          }
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

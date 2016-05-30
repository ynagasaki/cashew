'use strict';

(function() {
  var history = angular.module('cashewApp.History', ['ngRoute']);

  history.config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/history', {
      templateUrl: 'views/History/History.html',
      controller: 'HistoryController',
      controllerAs: 'hist'
    });
  }]);

  history.controller('HistoryController', ['$scope', 'PaymentsService', function($scope, PaymentsService) {
    var me = this;
    var now = moment().startOf('day');
    var groupPayments = function(payments) {
      var result = {
        paymentsMap: {},
        firstDate: null
      };
      var groupedPayments;
      payments.forEach(function(payment) {
        var paymentDate = moment([payment.year, payment.month - 1, 1]);
        var k = paymentDate.format('MMM YYYY');
        if (result.firstDate === null) {
          result.firstDate = paymentDate;
        }
        groupedPayments = result.paymentsMap[k];
        if (!groupedPayments) {
          result.paymentsMap[k] = groupedPayments = [];
        }
        groupedPayments.push(payment);
      });
      return result;
    };
    var getGraphData = function(paymentsByDate) {
      var result = { labels: [], datasets: [] };
      var dataset = { label: 'Total', data: [] };
      var key;
      var groupedPayments;
      var startDate = moment(now).add(-1, 'years');
      var firstDate = paymentsByDate.firstDate;

      if (startDate.isBefore(firstDate)) {
        startDate = firstDate;
      }

      for (var i = 0; i < 13; ++ i) {
        key = startDate.format('MMM YYYY');
        result.labels.push(key);
        groupedPayments = paymentsByDate.paymentsMap[key];
        if (groupedPayments) {
          dataset.data.push(groupedPayments.reduce(function(sum, pmt) { return sum + pmt.amount; }, 0));
        } else {
          dataset.data.push(0);
        }
        startDate.add(1, 'months');
      }

      result.datasets.push(dataset);
      return result;
    };

    me.payments = [];
    me.graph = null;

    me.updatePayments = function() {
      me.payments = PaymentsService.payments;
      me.paymentsByDate = groupPayments(me.payments);
      me.initGraph(getGraphData(me.paymentsByDate));
    };
    me.initGraph = function(graphData) {
      if (!me.graph) {
        Chart.defaults.global.legend.display = false;
        me.graph = new Chart(document.getElementById('payment-history'), {
          type: 'bar',
          data: graphData,
          options: {
            scales: {
              yAxes: [{
                ticks: {
                  beginAtZero: true
                }
              }]
            }
          }
        });
      }
      me.graph.data.datasets = graphData.datasets;
      me.graph.update();
    };

    $scope.$on('payments.refreshed', me.updatePayments);

    PaymentsService.refresh(moment(now).add(-1, 'years'));
  }]);
}());

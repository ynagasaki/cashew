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
    var getGraphData = function(payments) {
      var result = { labels: [], datasets: [] };
      var dataset = { label: 'Payable amount spent', data: [] };

      var key, groupedPayments;
      var startDate = moment(now).add(-1, 'years');
      var paymentsMap = {};
      var firstDate = null;

      payments.forEach(function(payment) {
        var paymentDate = moment([payment.year, payment.month - 1, 1]);
        var k = paymentDate.format('MMM YYYY');
        if (firstDate === null) {
          firstDate = paymentDate;
        }
        groupedPayments = paymentsMap[k];
        if (!groupedPayments) {
          paymentsMap[k] = groupedPayments = [];
        }
        groupedPayments.push(payment);
      });

      if (startDate.isBefore(firstDate)) {
        startDate = firstDate;
      }

      for (var i = 0; i < 13; ++ i) {
        key = startDate.format('MMM YYYY');
        result.labels.push(key);
        groupedPayments = paymentsMap[key];
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
      me.initGraph(getGraphData(me.payments));
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

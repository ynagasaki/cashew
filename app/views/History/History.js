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
      var result = { labels: [], series: [] };
      var key, groupedPayments;
      var frame = [];
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
          frame.push(groupedPayments.reduce(function(sum, pmt) { return sum + pmt.amount; }, 0));
        } else {
          frame.push(0);
        }
        startDate.add(1, 'months');
      }

      result.series.push(frame);
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
        me.graph = new Chartist.Bar('#payment-history', {
          labels: [],
          series: []
        }, {
          stackBars: true,
          axisY: {
            labelInterpolationFnc: function(value) {
              var intValue = parseInt(value, 10);
              return (intValue === value) ? intValue : null;
            }
          }
        }).on('draw', function(data) {
          if(data.type === 'bar') {
            data.element.attr({
              style: 'stroke-width: 30px'
            });
          }
        });
      }
      me.graph.update(graphData);
    };

    $scope.$on('payments.refreshed', me.updatePayments);

    PaymentsService.refresh(moment(now).add(-1, 'years'));
  }]);
}());

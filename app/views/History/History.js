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
      var last = null;
      var frame = [];
      payments.forEach(function(payment) {
        if (last === null || last.year !== payment.year || last.month !== payment.month) {
          result.labels.push(payment.month + '/' + payment.year);
          frame.push(0);
        }
        frame[frame.length - 1] += payment.amount;
        last = payment;
      });
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
              var intValue = parseInt(value);
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

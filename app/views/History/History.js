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
    var colors = [
      'rgba(194, 196, 210, 1)',
      'rgba(90, 180, 242, 1)',
      'rgba(255, 206, 73, 1)',
      'rgba(255, 97, 130, 1)',
      'rgba(68, 192, 193, 1)',
      'rgba(194, 196, 210, .6)',
      'rgba(90, 180, 242, .6)',
      'rgba(255, 206, 73, .6)',
      'rgba(255, 97, 130, .6)',
      'rgba(68, 192, 193, .6)',
      'rgba(194, 196, 210, .3)',
      'rgba(90, 180, 242, .3)',
      'rgba(255, 206, 73, .3)',
      'rgba(255, 97, 130, .3)',
      'rgba(68, 192, 193, .3)'
    ];
    var constants = {
      _notag: '(Untagged)',
      freqType: 'Frequency type',
      costType: 'Cost type',
      name: 'Payable name',
      setaside: 'Set-asides',
      monthly: 'Monthly payments',
      yearly: 'Yearly payments',
      fixed: 'Fixed costs',
      variable: 'Variable costs'
    };
    var sumPayments = function(sum, pmt) {
      return sum + pmt.amount;
    };
    var round = function(num) {
      return Math.round(num * 100) / 100;
    };
    var groupPaymentsByDate = function(payments) {
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
    var groupPaymentsByTag = function(payments, filterCategory) {
      if (!payments) {
        return { _notag: [] };
      }
      var otherPayments = [];
      var paymentsByTag = {};
      payments.forEach(function(pmt) {
        var l;
        var tagVal;
        if (pmt.tags) {
          for (var tagCategory in pmt.tags) {
            if (!pmt.tags.hasOwnProperty(tagCategory)) {
              continue;
            }
            if (filterCategory === tagCategory) {
              tagVal = pmt.tags[tagCategory];
              l = paymentsByTag[tagVal];
              if (!l) {
                paymentsByTag[tagVal] = l = [];
              }
              l.push(pmt);
            }
          }
        } else {
          otherPayments.push(pmt);
        }
      });
      paymentsByTag._notag = otherPayments;
      return paymentsByTag;
    };
    var getGraphData = function(paymentsByDate, filterCategory, tagsList) {
      var result = { labels: [], datasets: [] };
      var datasets = { _notag: [] };
      var i;
      var j;
      var key;
      var tag;
      var dateGroupedPayments;
      var tagGroupedPayments;
      var datasetList;
      var startDate = moment(now).add(-1, 'years');
      var firstDate = paymentsByDate.firstDate;

      if (startDate.isBefore(firstDate)) {
        startDate = firstDate;
      }
      for (i = 0; !!tagsList && i < tagsList.length; i ++) {
        tag = tagsList[i];
        datasets[tag] = [];
      }
      for (i = 0; i < 13; ++ i) {
        key = startDate.format('MMM YYYY');
        result.labels.push(key);
        dateGroupedPayments = paymentsByDate.paymentsMap[key];
        tagGroupedPayments = groupPaymentsByTag(dateGroupedPayments, filterCategory);
        for (j = 0; !!tagsList && j < tagsList.length; j ++) {
          tag = tagsList[j];
          datasetList = tagGroupedPayments[tag];
          if (!datasetList) {
            datasets[tag].push(0);
          } else {
            datasets[tag].push(round(datasetList.reduce(sumPayments, 0)));
          }
        }
        datasets._notag.push(
          round(tagGroupedPayments._notag.reduce(sumPayments, 0))
        );
        startDate.add(1, 'months');
      }
      i = 0;
      for (tag in datasets) {
        if (datasets.hasOwnProperty(tag)) {
          result.datasets.push({
            label: me.getConstant(tag),
            data: datasets[tag],
            backgroundColor: colors[i]
          });
          i = (i + 1) % colors.length;
        }
      }

      return result;
    };
    var getTagCategories = function(payments) {
      var categories = {};
      payments.forEach(function(p) {
        var items;
        var item;
        if (p.tags) {
          for (var category in p.tags) {
            if (p.tags.hasOwnProperty(category)) {
              items = categories[category];
              if (!items) {
                categories[category] = items = {};
              }
              item = p.tags[category];
              items[item] = item;
            }
          }
        }
      });
      return categories;
    };

    me.payments = [];
    me.graph = null;
    me.selectedCategory = null;
    me.tagCategories = null;

    me.updatePayments = function() {
      me.payments = PaymentsService.payments;
      me.tagCategories = getTagCategories(me.payments);
      me.selectedCategory = 'costType';
      me.updateGraphCategory();
    };
    me.updateGraphCategory = function() {
      var paymentsByDate = groupPaymentsByDate(me.payments);
      var filter = me.selectedCategory;
      var categoryTags = !me.tagCategories ? null : me.tagCategories[filter];
      var tagsList = !categoryTags ? null : Object.keys(categoryTags);
      me.graphData = getGraphData(paymentsByDate, filter, tagsList);
      me.initGraph(me.graphData);
    };
    me.getTagCategoriesList = function() {
      return !me.tagCategories ? [] : Object.keys(me.tagCategories);
    };
    me.initGraph = function(graphData) {
      if (!me.graph) {
        /*Chart.defaults.global.legend.display = false;*/
        Chart.defaults.global.legend.onClick = null;
        Chart.defaults.global.legend.labels.boxWidth = 12;
        me.graph = new Chart(document.getElementById('payment-history'), {
          type: 'bar',
          data: graphData,
          options: {
            scales: {
              xAxes: [{
                stacked: true
              }],
              yAxes: [{
                stacked: true,
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
    me.getConstant = function(key) {
      var result = constants[key];
      return !result ? key : result;
    };
    me.changeGraphCategory = function(category) {
      me.selectedCategory = category;
      me.updateGraphCategory();
    };

    $scope.$on('payments.refreshed', me.updatePayments);

    PaymentsService.refresh(moment(now).add(-1, 'years'));
  }]);
}());

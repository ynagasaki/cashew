'use strict';

(function() {
  describe('cashewApp.Dashboard module', function() {
    beforeEach(module('cashewApp.History'));

    describe('History controller', function() {
      it('uses "MMM YYYY" format for date-grouped payments', inject(function($controller) {
        var history = $controller('HistoryController', {$scope:{$on:noop}, PaymentsService: {
          refresh: noop,
          payments: [
            { amount: 10, year: 2016, month: 6, day: 1 },
            { amount: 20, year: 2016, month: 6, day: 23 },
            { amount: 50, year: 2016, month: 5, day: 9 },
            { amount: 100, year: 2015, month: 9, day: 18 },
            { amount: 200, year: 2013, month: 1, day: 2 },
          ]
        }});
        expect(history).toBeDefined();
        /*mock the graph*/
        history.graph = {
          data: {
            datasets: null
          },
          update: noop
        };
        history.updatePayments();
        /*var result = me.graph.data.datasets;
        expect(Object.getOwnPropertyNames(result).sort()).toBe([
          'Jan 2013',
          'Jun 2016',
          'May 2016',
          'Sep 2015'
        ]);*/
      }));
    });
  });
}());

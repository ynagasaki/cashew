'use strict';

(function() {
  describe('cashewApp.Dashboard module', function() {
    beforeEach(module('cashewApp.Dashboard'));

    var runUpdatePayables = function($controller, now, payablesArray) {
      var controller = $controller('DashboardController', {$scope: {$on: noop}, PayablesService: {
        refresh: noop,
        payables: payablesArray
      }});
      expect(controller).toBeDefined();
      if (now) {
        controller.setPeriod(now);
      }
      controller.updatePayables();
      return controller.payables;
    };

    describe('Dashboard controller', function() {
      it('should assign due dates to all payables on update', inject(function($controller) {
        var payables = runUpdatePayables($controller, null, [
          {subtype: 'monthly', day: 10},
          {subtype: 'yearly', month: 1, day: 20}
        ]);
        expect(payables.length).toBe(2);
        expect(payables[0].dueDate).toBeDefined();
        expect(payables[1].dueDate).toBeDefined();
      }));

      it('should show upcoming payables in period', inject(function($controller) {
        var payables = runUpdatePayables($controller, moment('2015-01-05'), [
          {subtype: 'monthly', day: 10},
          {subtype: 'yearly', month: 1, day: 15}
        ]);
        expect(payables[0].dueDate.format('YYYY-MM-DD')).toBe('2015-01-10');
        expect(payables[1].dueDate.format('YYYY-MM-DD')).toBe('2015-01-15');
      }));
      
      it('should show upcoming payables in period, regardless of month', inject(function($controller) {
        var payables = runUpdatePayables($controller, moment('2015-01-30'), [
          {subtype: 'monthly', day: 10},
          {subtype: 'yearly', month: 2, day: 15}
        ]);
        expect(payables[0].dueDate.format('YYYY-MM-DD')).toBe('2015-02-10');
        expect(payables[1].dueDate.format('YYYY-MM-DD')).toBe('2015-02-15');
      }));

      it('should show upcoming payables in period, regardless of month and year', inject(function($controller) {
        var payables = runUpdatePayables($controller, moment('2015-12-30'), [
          {subtype: 'monthly', day: 10},
          {subtype: 'yearly', month: 1, day: 15}
        ]);
        expect(payables[0].dueDate.format('YYYY-MM-DD')).toBe('2016-01-10');
        expect(payables[1].dueDate.format('YYYY-MM-DD')).toBe('2016-01-15');
      }));
    });
  });
})();

'use strict';

(function() {
  describe('cashewApp.Dashboard module', function() {
    beforeEach(module('cashewApp.Dashboard'));

    var setupController = function($controller, now, payablesArray) {
      var controller = $controller('DashboardController', {$scope: {$on: noop}, PayablesService: {
        refresh: noop,
        payables: payablesArray
      }});
      expect(controller).toBeDefined();
      if (now) {
        controller.setPeriod(now);
      }
      return controller;
    };

    var runUpdatePayables = function($controller, now, payablesArray) {
      var controller = setupController($controller, now, payablesArray);
      controller.updatePayables();
      return controller.payables;
    };

    describe('Dashboard controller', function() {
      it('should assign due dates to all payables on update', inject(function($controller) {
        var payables = runUpdatePayables($controller, moment('2015-01-09'), [
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

      it('should show upcoming payables occurring today', inject(function($controller) {
        var payables = runUpdatePayables($controller, moment('2015-01-05'), [
          {subtype: 'monthly', day: 5},
          {subtype: 'yearly', month: 1, day: 5}
        ]);
        expect(payables[0].dueDate.format('YYYY-MM-DD')).toBe('2015-01-05');
        expect(payables[1].dueDate.format('YYYY-MM-DD')).toBe('2015-01-05');
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

      it('should not show yearly payables that do not fall in the current period', inject(function($controller) {
        var payables = runUpdatePayables($controller, moment('2015-12-26'), [
          {subtype: 'yearly', month: 12, day: 25}
        ]);
        expect(payables.length).toBe(0);
      }));

      it('should assign current year to yearly payable due dates that have not happened yet',
        inject(function($controller) {
          var controller = setupController($controller, moment('2016-01-20'), []);
          expect(controller.getYearlyPayableDueDate({month: 2, day: 15}).format('YYYY-MM-DD')).toBe('2016-02-15');
        })
      );

      it('should assign next year to yearly payable due dates happening before current period',
        inject(function($controller) {
          var controller = setupController($controller, moment('2016-02-20'), []);
          expect(controller.getYearlyPayableDueDate({month: 1, day: 15}).format('YYYY-MM-DD')).toBe('2017-01-15');
        })
      );

      it('should assign current year to yearly payable due dates happening during current period',
        inject(function($controller) {
          var controller = setupController($controller, moment('2016-02-20'), []);
          expect(controller.getYearlyPayableDueDate({month: 2, day: 25}).format('YYYY-MM-DD')).toBe('2016-02-25');
        })
      );

      it('should make set-aside\'s orig payable\'s due date the curr year if payable has not happened yet',
        inject(function($controller) {
          var controller = setupController($controller, moment('2016-02-20'), []);
          var input = {original: {month: 5, day: 25}};
          var actual = controller.getSetAsideOriginalPayableDueDate(input).format('YYYY-MM-DD');
          expect(actual).toBe('2016-05-25');
        })
      );

      it('should make set-aside\'s orig payable\'s due date next year if payable has happened',
        inject(function($controller) {
          var controller = setupController($controller, moment('2016-02-20'), []);
          var input = {original: {month: 2, day: 19}};
          var actual = controller.getSetAsideOriginalPayableDueDate(input).format('YYYY-MM-DD');
          expect(actual).toBe('2017-02-19');
        })
      );

      it('should make set-aside\'s orig payable\'s due date next year if payable is happening',
        inject(function($controller) {
          var controller = setupController($controller, moment('2016-02-20'), []);
          var input = {original: {month: 2, day: 25}};
          var actual = controller.getSetAsideOriginalPayableDueDate(input).format('YYYY-MM-DD');
          expect(actual).toBe('2017-02-25');
        })
      );

      it('should make set-aside\'s orig payable\'s due date next year if payable has happened (year-end corner case)',
        inject(function($controller) {
          var controller = setupController($controller, moment('2016-12-30'), []);
          var input = {original: {month: 12, day: 29}};
          var actual = controller.getSetAsideOriginalPayableDueDate(input).format('YYYY-MM-DD');
          expect(actual).toBe('2017-12-29');
        })
      );
    });
  });
})();

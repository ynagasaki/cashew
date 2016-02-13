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

      it('should show upcoming payables occurring on period start day', inject(function($controller) {
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

      it('should only add set-asides if the yearly payable is not in the current period',
        inject(function($controller) {
          var controller = setupController($controller, moment('2016-02-20'), [
            {subtype: 'setaside', original: {month: 3, day: 1}}
          ]);
          controller.updatePayables();
          expect(controller.asides).toBeDefined();
          expect(controller.asides.length).toBe(0);
        })
      );

      it('should make set-aside\'s orig payable\'s due date the curr year if payable has not happened yet',
        inject(function($controller) {
          var controller = setupController($controller, moment('2016-02-20'), [
            {subtype: 'setaside', original: {month: 3, day: 25}}
          ]);
          controller.updatePayables();
          expect(controller.asides).toBeDefined();
          expect(controller.asides.length).toBe(1);
          expect(controller.asides[0].original.dueDate.format('YYYY-MM-DD')).toBe('2016-03-25');
        })
      );

      it('should make set-aside\'s orig payable\'s due date next year if payable has happened',
        inject(function($controller) {
          var controller = setupController($controller, moment('2016-02-20'), [
            {subtype: 'setaside', original: {month: 2, day: 19}}
          ]);
          controller.updatePayables();
          expect(controller.asides).toBeDefined();
          expect(controller.asides.length).toBe(1);
          expect(controller.asides[0].original.dueDate.format('YYYY-MM-DD')).toBe('2017-02-19');
        })
      );

      it('should make set-aside\'s orig payable\'s due date next year if payable has happened (year-end corner case)',
        inject(function($controller) {
          var controller = setupController($controller, moment('2016-12-30'), [
            {subtype: 'setaside', original: {month: 12, day: 29}}
          ]);
          controller.updatePayables();
          expect(controller.asides).toBeDefined();
          expect(controller.asides.length).toBe(1);
          expect(controller.asides[0].original.dueDate.format('YYYY-MM-DD')).toBe('2017-12-29');
        })
      );

      it('should find a payment made for a monthly payable',
        inject(function($controller) {
          var controller = setupController($controller, moment('2016-01-20'), []);
          var item = {
            subtype: 'monthly',
            dueDate: moment('2016-01-20'),
            payments: [
              {year: 2016, month: 1, day: 15, amount: 5},
              {year: 2016, month: 1, day: 20, amount: 10}
            ]
          };
          controller.determinePaymentMade(item);
          expect(item.payment).toBeDefined();
          expect(item.payment.amount).toBe(10);
        })
      );

      it('should find a payment made for a yearly payable',
        inject(function($controller) {
          var controller = setupController($controller, moment('2016-01-20'), []);
          var item = {
            subtype: 'yearly',
            dueDate: moment('2016-01-20'),
            payments: [
              {year: 2016, month: 1, day: 15, amount: 5},
              {year: 2016, month: 1, day: 20, amount: 10}
            ]
          };
          controller.determinePaymentMade(item);
          expect(item.payment).toBeDefined();
          expect(item.payment.amount).toBe(10);
        })
      );

      it('should find a payment made for a setaside payable (month shouldn\'t matter)',
        inject(function($controller) {
          var controller = setupController($controller, moment('2016-01-20'), []);
          var item = {
            subtype: 'setaside',
            dueDate: moment('2016-01-20'),
            payments: [
              {year: 2016, month: 2, day: 15, amount: 5},
              {year: 2016, month: 2, day: 20, amount: 10},
              {year: 2016, month: 1, day: 30, amount: 20}
            ]
          };
          controller.determinePaymentMade(item);
          expect(item.payment).toBeDefined();
          expect(item.payment.amount).toBe(20);
        })
      );

      it('should only define a "payment" field if a payment exists',
        inject(function($controller) {
          var controller = setupController($controller, moment('2016-01-20'), []);
          var item = {
            subtype: 'monthly',
            dueDate: moment('2016-01-20'),
            payments: []
          };
          controller.determinePaymentMade(item);
          expect(item.payment).toBeUndefined();
        })
      );

      it('should add "remainingAmount" to payables with partial payments',
        inject(function($controller) {
          var controller = setupController($controller, moment(), []);
          var item = {
            amount: 100,
            payments: [ {amount: 20}, {amount: 20} ]
          };
          controller.calculateRemainingAmount(item);
          expect(item.remainingAmount).toBeDefined();
          expect(item.remainingAmount).toBe(60);
        })
      );

      it('should NOT add "remainingAmount" to payables with no payments',
        inject(function($controller) {
          var controller = setupController($controller, moment(), []);
          var item = {
            amount: 100,
            payments: []
          };
          controller.calculateRemainingAmount(item);
          expect(item.remainingAmount).toBeUndefined();
        })
      );

      it('should treat payables that do not have an amount field as an amountless payable',
        inject(function($controller) {
          var payables = runUpdatePayables($controller, moment('2015-01-05'), [
            {subtype: 'monthly', day: 10},
            {subtype: 'yearly', month: 1, day: 15}
          ]);
          expect(payables[0].isAmountless).toBeDefined();
          expect(payables[0].isAmountless).toBe(true);
          expect(payables[1].isAmountless).toBeDefined();
          expect(payables[1].isAmountless).toBe(true);
        })
      );

      it('should not make set-aside payables amountless', inject(function($controller) {
        var controller = setupController($controller, moment('2016-02-20'), [
          {subtype: 'setaside', original: {month: 2, day: 19}}
        ]);
        controller.updatePayables();
        expect(controller.asides).toBeDefined();
        expect(controller.asides.length).toBe(1);
        expect(controller.asides[0].isAmountless).toBeUndefined();
      }));

      it('should set amount of amountless payable to be payment amount, only if payment exists',
        inject(function($controller) {
          var controller = setupController($controller, moment(), []);
          var item = {
            payment: {amount: 123},
            payments: [{amount: 123}]
          };
          controller.handleAmountlessItem(item);
          expect(item.amount).toBeDefined();
          expect(item.amount).toBe(123);

          item = { payments: [] };
          controller.handleAmountlessItem(item);
          expect(item.amount).toBeUndefined();
        })
      );

      it('should set suggested amount of amountless payable to be last payment amount, only if payments exist',
        inject(function($controller) {
          var controller = setupController($controller, moment(), []);
          var item = {
            payment: {amount: 123},
            payments: [{amount: 245}]
          };
          controller.handleAmountlessItem(item);
          expect(item.suggestedAmount).toBeDefined();
          expect(item.suggestedAmount).toBe(245);

          item = { payments: [] };
          controller.handleAmountlessItem(item);
          expect(item.suggestedAmount).toBeDefined();
          expect(item.suggestedAmount).toBe(0);
        })
      );

    });
  });
})();

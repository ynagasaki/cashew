'use strict';

(function() {
  describe('cashewApp.services module', function() {
    beforeEach(function() {
      module('cashewApp.services');
    });

    describe('PayablesService', function() {
      it('should maintain desc date order when updating payments', inject(function(PayablesService) {
        expect(PayablesService.addToPayments).toBeDefined();

        var item = {
          payments: [
            { year: 2016, month: 5, day: 1 },
            { year: 2016, month: 4, day: 1 },
            { year: 2016, month: 3, day: 1 }
          ]
        };

        PayablesService.addToPayments(item, { year: 2016, month: 6, day: 1 });
        expect(item.payments.length).toBe(4);
        expect(item.payments[0].month).toBe(6);

        PayablesService.addToPayments(item, { year: 2016, month: 3, day: 20 });
        expect(item.payments.length).toBe(5);
        expect(item.payments[3].month).toBe(3);
        expect(item.payments[3].day).toBe(20);
      }));

      it('should maintain desc date order when updating payments (year-end corner case)',
        inject(function(PayablesService) {
          expect(PayablesService.addToPayments).toBeDefined();

          var item = {
            payments: [
              { year: 2016, month: 12, day: 1 },
              { year: 2016, month: 11, day: 1 }
            ]
          };

          PayablesService.addToPayments(item, { year: 2017, month: 1, day: 1 });
          expect(item.payments.length).toBe(3);
          expect(item.payments[0].month).toBe(1);
        })
      );

      it('should remove payments according to payment ID/rev',
        inject(function(PayablesService) {
          expect(PayablesService.removeFromPayments).toBeDefined();

          var item = {
            payments: [
              { year: 2016, month: 12, day: 1, _id: 'ABC', _rev: '123' },
              { year: 2016, month: 11, day: 1, _id: 'DEF', _rev: '456' }
            ]
          };

          PayablesService.removeFromPayments(item, { _id: 'XYZ', _rev: '789' });
          expect(item.payments.length).toBe(2);

          PayablesService.removeFromPayments(item, { _id: 'DEF', _rev: '456' });
          expect(item.payments.length).toBe(1);
          expect(item.payments[0].month).toBe(12);
        })
      );

      it('should remove amount and suggestedAmount fields upon unpaying, if item is amountless',
        inject(function($httpBackend, PayablesService) {
          expect(PayablesService.unpay).toBeDefined();
          expect($httpBackend).toBeDefined();

          $httpBackend.expect('DELETE', /\/api\/delete\/(.+)\/(.+)/).respond(
            function(method, url, data, headers, params) {
              return [200, { data: { ok: true } }];
            }
          );

          var item = { payment: { amount: 123 }, amount: 123, suggestedAmount: 345, isAmountless: true };
          PayablesService.unpay(item);

          $httpBackend.flush();

          expect(item.amount).toBe(null);
          expect(item.suggestedAmount).toBe(null);
        })
      );

      it('should set amount and suggestedAmount fields upon paying, if item is amountless',
        inject(function($httpBackend, PayablesService) {
          expect(PayablesService.pay).toBeDefined();
          expect($httpBackend).toBeDefined();

          $httpBackend.expect('PUT', /\/api\/pay/).respond(
            function(method, url, data, headers, params) {
              return [200, { data: { ok: true } }];
            }
          );

          var item = { amount: 123, isAmountless: true, dueDate: moment(), subtype: 'monthly', key: 'lol' };
          PayablesService.pay(item);

          $httpBackend.flush();

          expect(item.amount).toBeDefined();
          expect(item.suggestedAmount).toBeDefined();
          expect(item.amount).toBe(123);
          expect(item.suggestedAmount).toBe(123);
        })
      );
    });
  });
}());

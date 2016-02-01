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
    });
  });
})();

'use strict';

(function() {
  describe('cashewApp.services module', function() {
    beforeEach(function() {
      module('cashewApp.services');
    });

    describe('LineItemsService', function() {
      it('should assign today\'s date as the start date of new line items',
        inject(function($httpBackend, LineItemsService) {
          expect(LineItemsService).toBeDefined();
          expect($httpBackend).toBeDefined();

          $httpBackend.expect('PUT', /\/api\/put\/line-item/).respond(
            function(method, url, data, headers, params) {
              return [200, { data: { ok: true, id: 'bla', rev: 'fest' } }];
            }
          );

          var item = {};
          LineItemsService.put(item);

          $httpBackend.flush();

          expect(item._id).toBe('bla');
          expect(item._rev).toBe('fest');
          expect(item.startDate).toBeDefined();
          expect(item.startDate.format).toBeDefined();
          expect(item.startDate.format('YYYY-MM-DD')).toBe(moment().startOf('day').format('YYYY-MM-DD'));
        })
      );
    });
  });
})();

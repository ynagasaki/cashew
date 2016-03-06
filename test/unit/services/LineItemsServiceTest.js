'use strict';

(function() {
  describe('cashewApp.services module', function() {
    beforeEach(function() {
      module('cashewApp.services');
    });

    describe('LineItemsService', function() {
      it('should assign today\'s date (as unix timestamp) as the start date of new line items',
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
          expect(item.startDate).toBe(moment().startOf('day').unix());
        })
      );
    });

    describe('LineItemsService', function() {
      it('should assign today\'s date (as unix timestamp) as the end date of closed line items',
        inject(function($httpBackend, LineItemsService) {
          expect(LineItemsService).toBeDefined();
          expect($httpBackend).toBeDefined();

          $httpBackend.expect('PUT', /\/api\/update\/line-item/).respond(
            function(method, url, data, headers, params) {
              return [200, { msg: 'updated' }];
            }
          );

          var item = {};
          LineItemsService.close(item);

          $httpBackend.flush();

          expect(item.endDate).toBeDefined();
          expect(item.endDate).toBe(moment().startOf('day').unix());
        })
      );
    });

    describe('LineItemsService', function() {
      it('should not assign an end date to closed line items if updating failed',
        inject(function($httpBackend, LineItemsService) {
          expect(LineItemsService).toBeDefined();
          expect($httpBackend).toBeDefined();

          $httpBackend.expect('PUT', /\/api\/update\/line-item/).respond(
            function(method, url, data, headers, params) {
              return [400, { msg: '(this is a mock error for a test)' }];
            }
          );

          var item = {};
          LineItemsService.close(item);

          $httpBackend.flush();

          expect(item.endDate).toBeUndefined();
        })
      );
    });
  });
}());

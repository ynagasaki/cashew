'use strict';

(function() {
  describe('cashewApp.services module', function() {
    beforeEach(function() {
      module('cashewApp.services');
    });

    describe('PaymentsService', function() {
      it('should not refresh if from not provided',
        inject(function($httpBackend, PaymentsService) {
          expect(PaymentsService).toBeDefined();
          PaymentsService.refresh(null);
          $httpBackend.verifyNoOutstandingRequest();
        })
      );
    });
  });
}());

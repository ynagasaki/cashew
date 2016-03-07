'use strict';

(function() {
  describe('cashewApp.services module', function() {
    beforeEach(function() {
      module('cashewApp.services');
    });

    describe('PaymentsService', function() {
      it('should not refresh if from and to have not been provided',
        inject(function($httpBackend, PaymentsService) {
          expect(PaymentsService).toBeDefined();
          PaymentsService.refresh(null, moment());
          PaymentsService.refresh(moment(), null);
          PaymentsService.refresh(null, null);
          $httpBackend.verifyNoOutstandingRequest();
        })
      );
    });
  });
}());

'use strict';

(function() {
  describe('cashewApp.Dashboard module', function() {
    beforeEach(module('cashewApp.Dashboard'));

    describe('Dashboard controller', function() {
      it('should assign due dates to all payables on update', inject(function($controller) {
        var controller = $controller('DashboardController', {$scope: {$on: noop}, PayablesService: {
          refresh: noop,
          payables: [
            {subtype: 'monthly', day: 10},
            {subtype: 'yearly', month: 1, day: 20}
          ]
        }});

        expect(controller).toBeDefined();
        controller.updatePayables();
        expect(controller.payables.length).toBe(2);
        expect(controller.payables[0].dueDate).toBeDefined();
        expect(controller.payables[1].dueDate).toBeDefined();
      }));
    });
  });
})();

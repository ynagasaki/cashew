'use strict';

(function() {
  describe('cashewApp.Planner module', function() {
    beforeEach(module('cashewApp.Planner'));

    describe('Planner controller', function() {
      it('should use LineItemsService to remove line items', inject(function($controller) {
        var remove_called = false;
        var remove = function(item) {
          remove_called = true;
        };
        var planner = $controller('Planner', {$scope:{$on:noop}, LineItemsService: {
          lineItems:[],
          put: noop,
          refresh: noop,
          remove: remove
        }});
        expect(planner).toBeDefined();
        planner.removeLineItem({lol:1});
        expect(remove_called).toBe(true);
      }));
    });
  });
})();

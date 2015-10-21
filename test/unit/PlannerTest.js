'use strict';

describe('cashewApp.view1 module', function() {

  beforeEach(module('cashewApp.Planner'));

  describe('view1 controller', function(){

    it('should ....', inject(function($controller) {
      var noop = function() {};
      var view1Ctrl = $controller('Planner', {$scope:{$on:noop}, LineItemsService:{lineItems:[], put:noop, refresh:noop}});
      expect(view1Ctrl).toBeDefined();
    }));

  });
});
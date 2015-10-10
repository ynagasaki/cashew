'use strict';

describe('cashewApp.view1 module', function() {

  beforeEach(module('cashewApp.LineItemLister'));

  describe('view1 controller', function(){

    it('should ....', inject(function($controller) {
      var noop = function() {};
      var view1Ctrl = $controller('LineItemLister', {$scope:{$on:noop}, LineItemsService:{lineItems:[], put:noop, refresh:noop}});
      expect(view1Ctrl).toBeDefined();
    }));

  });
});
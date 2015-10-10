'use strict';

describe('myApp.view1 module', function() {

  beforeEach(module('myApp.LineItemLister'));

  describe('view1 controller', function(){

    it('should ....', inject(function($controller) {
      var noop = function() {};
      var view1Ctrl = $controller('LineItemLister', {$scope:{$on:noop}, LineItemsService:{lineItems:[], put:noop, refresh:noop}});
      expect(view1Ctrl).toBeDefined();
    }));

  });
});
'use strict';

describe('cashewApp.version module', function() {
  beforeEach(module('cashewApp.version'));

  describe('version service', function() {
    it('should return current version', inject(function(version) {
      expect(version).toEqual('1.0.0');
    }));
  });
});

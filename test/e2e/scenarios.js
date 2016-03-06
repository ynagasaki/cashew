'use strict';

/* https://github.com/angular/protractor/blob/master/docs/toc.md */

describe('my app', function() {
  it('should automatically redirect to dashboard when location hash/fragment is empty', function() {
    browser.get('index.html');
    expect(browser.getLocationAbsUrl()).toMatch('/');
    expect(element(by.id('calendar'))).toBeDefined();
  });

  describe('Planning tab', function() {
    beforeEach(function() {
      browser.get('index.html#/plan');
    });

    it('should render line item adder when user navigates to /plan', function() {
      expect(element(by.id('itemAdder'))).toBeDefined();
    });
  });
});

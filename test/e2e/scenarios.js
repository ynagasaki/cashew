'use strict';

/* https://github.com/angular/protractor/blob/master/docs/toc.md */

describe('my app', function() {
  it('should automatically redirect to dashboard when location hash/fragment is empty', function() {
    browser.get('index.html');
    expect(browser.getLocationAbsUrl()).toMatch("/");
    /*expect(element.all)*/
  });

  describe('view1', function() {
    beforeEach(function() {
      browser.get('index.html#/line-items');
    });

    it('should render view1 when user navigates to /view1', function() {
      expect(element.all(by.css('[ng-view] div')).first().getText()).toBeDefined();
    });
  });
});

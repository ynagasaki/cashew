'use strict';

(function() {
  describe('couchdb views tests', function() {
    beforeEach(clearEmitResults);
    afterEach(clearEmitResults);

    describe('\'payables\' view', function() {
      it('should emit a payable for each entry in \'freq\'', function() {
        var views = exports.getViewsForTesting();
        var emitValue;

        expect(views).toBeDefined();
        expect(views.payables).toBeDefined();
        expect(views.payables.map).toBeDefined();

        views.payables.map({
          doctype: 'lineitem', type: 'minus', name: 'test1', amount: 123, freq: {per: 'mo', on: [{D:1},{D:2}]}
        });

        expect(EMIT_RESULTS.length).toBe(2);

        /* first emitted key-value pair's value entry */
        emitValue = EMIT_RESULTS[0].value;
        expect(emitValue.name).toBe('test1');
        expect(emitValue.day).toBeDefined();
        expect(emitValue.day).toBe(1);

        emitValue = EMIT_RESULTS[1].value;
        expect(emitValue.name).toBe('test1');
        expect(emitValue.day).toBeDefined();
        expect(emitValue.day).toBe(2);
      });

      it('should emit 0 for payable keys; 1 for payment keys', function() {
        var views = exports.getViewsForTesting();
        var emitKey;

        expect(views).toBeDefined();
        expect(views.payables).toBeDefined();
        expect(views.payables.map).toBeDefined();

        views.payables.map({
          _id: 'xyz', doctype: 'lineitem', type: 'minus', name: 'test1', amount: 123, freq: {per: 'mo', on: [{D:1}]}
        });
        views.payables.map({
          lineitem_id: 'xyz', doctype: 'payment', amount: 123, day: 1, month: 1, year: 2015
        });

        expect(EMIT_RESULTS.length).toBe(2);

        emitKey = EMIT_RESULTS[0].key;
        expect(emitKey[0]).toBe('xyz');
        expect(emitKey[1]).toBe(0);

        emitKey = EMIT_RESULTS[1].key;
        expect(emitKey[0]).toBe('xyz');
        expect(emitKey[1]).toBe(1);
      });
    });
  });
})();

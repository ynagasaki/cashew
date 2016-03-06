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

      it('should not emit payables for line items with endDate defined', function() {
        var views = exports.getViewsForTesting();
        var emitValue;

        expect(views).toBeDefined();
        expect(views.payables).toBeDefined();
        expect(views.payables.map).toBeDefined();

        views.payables.map({
          doctype: 'lineitem', type: 'minus', name: 'test1', amount: 123, freq: {per: 'mo', on: [{D:1},{D:2}]},
          endDate: 123
        });

        expect(EMIT_RESULTS.length).toBe(0);
      });
    });

    describe('\'line-items\' view', function() {
      it('should emit {} for endDate portion of key if endDate not defined', function() {
        var views = exports.getViewsForTesting();
        var emitKey;

        expect(views).toBeDefined();
        expect(views['line-items']).toBeDefined();
        expect(views['line-items'].map).toBeDefined();

        views['line-items'].map({
          doctype: 'lineitem', type: 'minus', name: 'test1', amount: 123, freq: {per: 'mo', on: [{D:1}]},
          startDate: 123
        });

        expect(EMIT_RESULTS.length).toBe(1);

        /* first emitted key-value pair's value entry */
        emitKey = EMIT_RESULTS[0].key;
        expect(emitKey[0]).toBeDefined();
        expect(emitKey[0]).toEqual({});
        expect(emitKey[1]).toBeDefined();
        expect(emitKey[1]).toBe(123);
      });
    });
  });
}());

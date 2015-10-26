'use strict';

(function() {
  var views = {
    'line-items': {
      map: function(doc) {
        if (doc.doctype === 'lineitem') {
          emit(doc._id, doc);
        }
      }
    },
    'payables': {
      map: function(doc) {
        var payable;
        var date;
        if (doc.doctype === 'lineitem' && doc.type === 'minus' && doc.freq) {
          for (var i = 0; i < doc.freq.on.length; ++i) {
            date = doc.freq.on[i];
            payable = {
              doctype: 'payable',
              name: doc.name,
              amount: doc.amount,
              day: date.D
            };
            if (date.M) {
              payable.month = date.M;
            }
            emit([doc._id, 0], payable);
          }
        } else if (doc.doctype === 'payment') {
          emit([doc.lineitem_id, 1], doc);
        }
      }
    },
    'payments': {
      map: function(doc) {
        if (doc.doctype === 'payment') {
          emit(doc._id, doc);
        }
      }
    }
  };

  exports.getAll = function() {
    var result = {};
    var mapper, reducer;
    var resplace = function(str) {
      return str.replace(/[\n\t\r ]+/g, ' ');
    };
    
    for (var view_name in views) {
      if (!views.hasOwnProperty(view_name)) {
        continue;
      }
      
      console.log('  Adding view: ' + view_name);

      mapper = resplace((views[view_name].map || 'lol').toString());
      reducer = resplace((views[view_name].reduce || 'lol').toString());

      if (mapper === 'lol') {
        console.warn('  Map method of view \'' + view_name + '\' not defined. Skipping.');
        continue;
      }

      result[view_name] = (reducer === 'lol') ? {map : mapper} : {map : mapper, reduce : reducer};
    }
    
    return result;
  };
})();

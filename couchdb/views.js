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
        var day;
        if (doc.doctype === 'lineitem' && doc.type === 'minus' && doc.freq) {
          for (var i = 0; i < doc.freq.on.length; ++i) {
            date = doc.freq.on[i];
            payable = {
              doctype: 'payable',
              subtype: 'monthly',
              name: doc.name,
              amount: doc.amount,
              day: date.D
            };
            if (date.M) {
              payable.subtype = 'yearly';
              payable.month = date.M;
              if (!!doc.freq.split) {
                payable.subtype = 'setaside';
                payable.fullAmount = doc.amount;
                payable.amount = Math.round(doc.amount / 12);
              }
            }
            emit([doc._id, 0, payable.day], payable);
          }
        } else if (doc.doctype === 'payment') {
          day = (doc.day ? doc.day : 0);
          emit([doc.lineitem_id, 1, day, [doc.year, doc.month, day]], doc);
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

'use strict';

(function() {
  var views = {
    'line-items': {
      map: function(doc) {
        if (doc.doctype === 'lineitem') {
          emit([(!doc.endDate) ? {} : doc.endDate, doc.startDate, doc._id], doc);
        }
      }
    },
    'payables': {
      map: function(doc) {
        var payable, date, key;
        if (doc.doctype === 'lineitem' && doc.type === 'minus' && doc.freq && !doc.endDate) {
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
              payable.split = !!doc.freq.split;
              payable.key = [doc._id, 'YR', payable.day, payable.month].join('_');
              /*emit yearly payable*/
              emit(payable.key, payable);
              if (payable.split) {
                key = [doc._id, 'SA', payable.day, payable.month].join('_');
                /*emit 'set-aside' payable*/
                emit(key, {
                  key: key,
                  doctype: 'payable',
                  subtype: 'setaside',
                  amount: Math.round(doc.amount / 12),
                  original: payable
                });
              }
            } else {
              payable.key = [doc._id, 'MO', payable.day, null].join('_');
              /*emit monthly payable*/
              emit(payable.key, payable);
            }
          }
        }
      }
    },
    'payments': {
      map: function(doc) {
        if (doc.doctype === 'payment') {
          emit([doc.year, doc.month, doc.day, doc.key], doc);
        }
      }
    }
  };

  exports.getViewsForTesting = function() {
    return views;
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

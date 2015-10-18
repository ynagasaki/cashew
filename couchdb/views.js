'use strict';

(function() {
  var views = {
    'upcoming_payables': {
      'map': function(item) {
        if (item.doctype === 'lineitem') {

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
      
      mapper = resplace((views[view_name].map || 'lol').toString());
      reducer = resplace((views[view_name].reduce || 'lol').toString());

      if (mapper === 'lol') {
        console.warn('Map method of view \'' + view_name + '\' not defined. Skipping.');
        continue;
      }

      result[view_name] = (reducer === 'lol') ? {map : mapper} : {map : mapper, reduce : reducer};
    }
    
    return result;
  };
})();

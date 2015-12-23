'use strict';

/* Define mock stuff here I guess, becuase I don't get how JS frameworks work. */

var exports = {};
var EMIT_RESULTS = [];
var emit = function(key, value) {
  EMIT_RESULTS.push({'key': key, 'value': value});
};
var clearEmitResults = function() {
  EMIT_RESULTS = [];
};

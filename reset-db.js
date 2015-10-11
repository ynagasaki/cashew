(function() {
  var nano = require('nano')('http://localhost:5984');
  nano.db.destroy('line_items', function() {
    nano.db.create('line_items', function() {
      console.log("* Created 'line_items'");
    });
  });
})()

(function () {
  var nano = require('nano')('http://localhost:5984');
  var line_items = nano.db.use('line_items');
  var express = require('express');
  var bodyParser = require('body-parser');
  var app = express();
  var jsonParser = bodyParser.json();

  app.use(express.static('app'));

  app.get('/hello', function (req, res) {
    res.send('world!');
  });

  app.put('/api/addLineItem', jsonParser, function (req, res) {
    if (!req.body) {
      return res.status(400).json({ msg: "error: no body" });
    }
    line_items.insert(req.body, 'jankomcstanko', function(err, body, header) {
      if (err) {
        res.status(500).json({ msg: "error: save failed", data: err });
        return;
      }
      res.json({ msg: "inserted", data: body });
    });
  })

  var server = app.listen(3000, function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log('cashew listening at http://%s:%s', host, port);
  });
})()

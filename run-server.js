(function () {
  /*var nano = require('nano')('http://localhost:5984');
  var line_items = nano.db.use('line_items');*/

  var express = require('express');
  var bodyParser = require('body-parser');

  var app = express();
  var jsonParser = bodyParser.json();

  app.use(express.static('app'));

  app.get('/hello', function (req, res) {
    res.send('world!');
  });

  app.post('/api/addLineItem', jsonParser, function (req, res) {
    if (!req.body) {
      return res.status(400).json({ msg: "no body" });
    }
    console.log(req.body);
    res.json({ msg: "ok" });
  })

  var server = app.listen(3000, function() {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
  });
})()

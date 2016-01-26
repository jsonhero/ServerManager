var express = require('express');
var router = express.Router();
var fs = require('fs');


router.get('/hosts', function(req, res) {
  var json = fs.readFileSync('hosts.json', {encoding: 'utf8'});
  res.json(JSON.parse(json));
});

module.exports = router;

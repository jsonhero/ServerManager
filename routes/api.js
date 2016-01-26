var express = require('express');
var router = express.Router();
var fs = require('fs');


router.get('/hosts', function(req, res) {
  var json = fs.readFileSync('hosts.json', {encoding: 'utf8'});
  res.send(json);
});

router.post('/hosts', function(req, res) {
  var host = req.body;
  var json = fs.readFileSync('hosts.json', {encoding: 'utf8'});
  var hosts = JSON.parse(json);
  hosts.hosts.push(host);
  fs.writeFileSync('hosts.json', JSON.stringify(hosts));
});

router.delete('/hosts', function(req, res) {
  var hostname = req.body.hostname;
  var json = fs.readFileSync('hosts.json', {encoding: 'utf8'});
  var hosts = JSON.parse(json);

  for (var i = 0; i < hosts.hosts.length; i++) {
    if (hosts.hosts[i].hostname == hostname) {
      hosts.hosts.splice(i, 1);
      break;
    }
  };

  fs.writeFileSync('hosts.json', JSON.stringify(hosts));
});

module.exports = router;

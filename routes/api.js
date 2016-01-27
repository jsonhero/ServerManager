var express = require('express');
var router = express.Router();
var Host = require('../models/Host');
var fs = require('fs');
var actions = require('./actions');

router.use('/action', actions);

router.get('/hosts', function(req, res) {
  Host.find({}, function(err, hosts) {
    res.json(hosts);
  });
});

router.post('/hosts', function(req, res) {
  var host = req.body;
  Host.create({
    host: host.host,
    hostname: host.hostname,
    hostgroup: host.hostgroup,
    username: host.username,
    password: host.password
  }, function(err, host) {
    if (err) console.log(err);
  });
});

router.delete('/hosts', function(req, res) {
  Host.remove({ hostname: req.body.hostname}, function(err, removed) {
  });
});

module.exports = router;

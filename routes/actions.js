var express = require('express');
var router = express.Router();
var Log = require('../models/Log');
var Hosts = require('../models/Host');
var SSHPool = require('../helpers/SSHLib')
var fs = require('fs');
var moment = require('moment');
var actions = require('../helpers/actions');

var script = [];


router.post('/command', function(req, res) {
  var command = req.body.command.trim();
  var servers = req.body['servers[]'];
  var username = req.session.user.username;

  actions.command(servers, command, username);
});

router.post('/folder', function(req, res) {

});

router.post('/put', function(req, res) {
  console.log(req.body, 'PUT');
  var localpath = req.body.localpath;
  var remotepath = req.body.remotepath;
  var username = req.session.user.username;
  var servers = req.body['servers[]'];

  actions.put(servers, localpath, remotepath, username);
});

router.get('/history', function(req, res) {
  Log.find({ date: {
    $gte: moment().subtract(10, 'minutes')
  }}, function(err, logs) {

    res.json(logs);
  });
});

router.get('/allhistory', function(req, res) {
  Log.find({}, function(err, logs) {
    res.json(logs);
  });
});

module.exports = router;

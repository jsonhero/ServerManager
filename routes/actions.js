var express = require('express');
var router = express.Router();
var Log = require('../models/Log');
var Hosts = require('../models/Host');
var SSHPool = require('../helpers/SSHLib')
var fs = require('fs');
var moment = require('moment');
var actions = require('../helpers/actions');
var Model = require('../models/Script');

var script = [];


router.post('/command', function(req, res) {
  var command = req.body.command.trim();
  var servers = req.body['servers[]'];
  var username = req.session.user.username;

  var info = {data: {command: command}};

  actions.command(info, servers, username);
});

router.post('/folder', function(req, res) {

});

router.post('/jar', function(req, res) {
  var username = req.session.user.username;
  var servers = req.body['servers[]'];
  var jar = req.body.jar;

  var info = {data: {jar: jar}};

  actions.jar(info, servers, username);
});


router.post('/put', function(req, res) {
  console.log(req.body, 'PUT');
  var localpath = req.body.localpath;
  var remotepath = req.body.remotepath;
  var username = req.session.user.username;
  var servers = req.body['servers[]'];

  actions.put(servers, localpath, remotepath, username);
});

router.post('/screen', function(req, res) {
  var username = req.session.user.username;
  var servers = req.body['servers[]'];
  var screenAction = req.body.screenAction;

  var info = {data: {screenAction: screenAction}};

  actions.screen(info, servers, username);
});

router.post('/script', function(req, res) {
  var username = req.session.user.username;
  var servers = req.body['servers[]'];

  Model.Script.findOne({name: req.body.script}, function(err, script) {
    script.actions.forEach(function(action) {
      actions[action.type](action, servers, username);
    });
  });
});

router.post('/copy', function(req, res) {
  var username = req.session.user.username;
  var servers = req.body['servers[]'];

  var info = {
    data: {
      copyfile: req.body.copyfile,
      pathname: req.body.pathname
    }
  }

  actions.copy(info, servers, username);
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

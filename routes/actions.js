var express = require('express');
var router = express.Router();
var Log = require('../models/Log');
var SSHPool = require('../helpers/SSHLib')
var fs = require('fs');
var moment = require('moment');

var hosts = fs.readFileSync('hosts.json', {encoding: 'utf8'});
var ConnectionPool = new SSHPool(JSON.parse(hosts).hosts);

router.post('/command', function(req, res) {
  console.log('request called');

  var callback = function(conn) {
    var output = [];
    var error = false;
    conn.exec(req.body.command.trim(), function(err, stream) {

      stream.on('data', function(data) {
        output.push(data.toString());
      });

      stream.stderr.on('data', function(data) {
        console.log('STDERR: ', data.toString());
        error = true;
        output.push("ERROR: " + data.toString());
      });

      stream.on('close', function() {
        conn.end();
      });
    });

    conn.on('error', function(err) {
      console.log("CONNECTION ERROR " + conn.config.host, err);
    });

    conn.on('close', function() {
      Log.create({
        user: req.session.user.username,
        hostname: conn.config.host,
        hostgroup: 'sgrl',
        actiontype: 'command',
        action: req.body.command.trim(),
        output: output.join("\n"),
        error: error
      }, function(err, log) {
        if (err) console.log(err);
        console.log("created a new log!");
      });
    });
  }

  var closeback = function() {
    console.log("Removing listeners");
    ConnectionPool.removeListener('ready', callback);
    ConnectionPool.removeListener('close', closeback);
  };

  ConnectionPool.on('ready', callback);
  ConnectionPool.on('close', closeback);

  ConnectionPool.connect();
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

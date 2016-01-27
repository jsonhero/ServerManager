var express = require('express');
var router = express.Router();
var Log = require('../models/Log');
var Hosts = require('../models/Host');
var SSHPool = require('../helpers/SSHLib')
var fs = require('fs');
var moment = require('moment');



router.post('/command', function(req, res) {
  var command = req.body.command.trim();
  var servers = req.body['servers[]'];


  Hosts.find({ 'hostname': { $in: servers }}, function(err, hosts) {
    var ConnectionPool = new SSHPool(hosts);
    var callback = function(conn) {
      var output = [];
      var error = false;
      conn.exec(command, function(err, stream) {

        stream.on('data', function(data) {
          output.push(data.toString());
        });

        stream.stderr.on('data', function(data) {
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
        Hosts.findOne({host: conn.config.host}, function(err, host) {
          Log.create({
            user: req.session.user.username,
            hostname: host.hostname,
            hostgroup: host.hostgroup,
            actiontype: 'command',
            action: command,
            output: output.join("\n"),
            error: error
          }, function(err, log) {
            if (err) console.log(err);
          });
        });
      });
    };
    var closeback = function() {
      console.log("Removing listeners");
      ConnectionPool.removeListener('ready', callback);
      ConnectionPool.removeListener('close', closeback);
    };

    ConnectionPool.on('ready', callback);
    ConnectionPool.on('close', closeback);

    ConnectionPool.connect();
  });

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

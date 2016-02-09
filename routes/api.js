var express = require('express');
var router = express.Router();
var Host = require('../models/Host');
var fs = require('fs');
var actions = require('./actions');
var mysql = require('mysql');
var Model = require('../models/Script');
var moment = require('moment');

router.use('/action', actions);

router.get('/hosts', function(req, res) {
  Host.find({}, function(err, hosts) {
    res.json(hosts);
    res.end();
  });
});

router.post('/hosts', function(req, res) {
  var host = req.body;
  Host.create({
    host: host.host,
    hostname: host.hostname,
    hostgroup: host.hostgroup,
    username: host.username || 'root',
    password: host.password
  }, function(err, host) {
    if (err) console.log(err);
    res.end();
  });
});

router.delete('/hosts', function(req, res) {
  Host.remove({ hostname: req.body.hostname}, function(err, removed) {
    res.end();
  });
});

router.get('/scripts', function(req, res) {
  Model.Script.find({}, function(err, scripts) {
    res.json(scripts);
    res.end();
  });
});

router.get('/script/:name', function(req, res) {
  var scriptName = req.params.name;
  Model.Script.findOne({name: scriptName}, function(err, script) {
    res.json(script);
    res.end();
  });
});

router.delete('/script', function(req, res) {
  Model.Script.remove({name: req.body.name}, function(err, removed) {
    res.end();
  });
});

router.post('/script', function(req, res) {
  Model.Script.create({
    name: req.body.name
  }, function(err, script) {
    if (err) throw err;
    res.end();
  });
});

router.post('/script/action', function(req, res) {
  console.log(req.body);

  var action = {
    type: req.body.type,
    info: req.body.info,
    data: req.body
  }

  Model.Script.findOne({name: req.body.script}, function(err, script) {
    script.actions.push(action);
    script.save();
    res.end();
  });
});

router.delete('/script/action', function(req, res) {
  Model.Script.findOne({ name: req.body.script}, function(err, script) {
    var children = script.actions.filter(function(action) {
      return action._id != req.body.id;
    });
    script.actions = children;
    script.save();
    res.end();
  });
});

router.get('/jars', function(req, res) {
  var contents = fs.readFileSync('jars.json', {encoding: 'utf8'});
  res.send(contents);
  res.end();
});

router.get('/serverstatus', function(req, res) {
  var connection = mysql.createConnection({
    host     : process.env.MineswineDB,
    user     : process.env.MineswineDBUser,
    password : process.env.MineswineDBPass,
    database : process.env.MineswineDBName
  });

  connection.connect();

  connection.query('SELECT * FROM servers_status', function(err, rows, fields) {
    if (err) throw err;
    rows = rows.map(function(row) {
      row.data = JSON.parse(row.data);
      var now = moment.utc();
      if (row.data.lastUpdated < (now - 20000)) {
        row.data.online = false;
        row.data.playersOnline = 0;
      }
      return row;
    });
    res.json(rows);
    res.end();
  });

  connection.end();
});

router.get('/loadcopy', function(req, res) {
  var dirContents = fs.readdirSync('./copy');
  var filtered = dirContents.filter(function(file) {
    var path = './copy/' + file;
    var stats = fs.statSync(path);
    return !stats.isDirectory();
  });
  res.json(filtered);
  res.end();
});

module.exports = router;

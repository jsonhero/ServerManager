var express = require('express');
var router = express.Router();
var Host = require('../models/Host');
var fs = require('fs');
var actions = require('./actions');
var mysql = require('mysql');
var Model = require('../models/Script');

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
    username: host.username || 'root',
    password: host.password
  }, function(err, host) {
    if (err) console.log(err);
  });
});

router.delete('/hosts', function(req, res) {
  Host.remove({ hostname: req.body.hostname}, function(err, removed) {
  });
});

router.get('/scripts', function(req, res) {
  Model.Script.find({}, function(err, scripts) {
    res.json(scripts);
  });
});

router.get('/script/:name', function(req, res) {
  var scriptName = req.params.name;
  Model.Script.findOne({name: scriptName}, function(err, script) {
    res.json(script);
  });
});

router.delete('/script', function(req, res) {
  Model.Script.remove({name: req.body.name}, function(err, removed) {
  });
});

router.post('/script', function(req, res) {
  Model.Script.create({
    name: req.body.name
  }, function(err, script) {
    if (err) throw err;

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
  });
});

router.delete('/script/action', function(req, res) {
  Model.Script.findOne({ name: req.body.script}, function(err, script) {
    var children = script.actions.filter(function(action) {
      return action._id != req.body.id;
    });
    script.actions = children;
    script.save();
  });
});

router.get('/jars', function(req, res) {
  var contents = fs.readFileSync('jars.json', {encoding: 'utf8'});
  res.send(contents);
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

    res.json(rows);
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
});

module.exports = router;

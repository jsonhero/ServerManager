var express = require('express');
var router = express.Router();
var SSHPool = require('../helpers/SSHLib')
var fs = require('fs');

var hosts = fs.readFileSync('hosts.json', {encoding: 'utf8'});
var ConnectionPool = new SSHPool(JSON.parse(hosts).hosts);




router.post('/command', function(req, res) {
  console.log('request called');

  var callback = function(conn) {
    console.log('called!');
    conn.exec(req.body.command.trim(), function(err, stream) {

      stream.on('data', function(data) {
        stream.end();
      });

      stream.on('close', function() {
        console.log('closing stream');
        conn.end();
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

});

module.exports = router;

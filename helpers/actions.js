var SSHPool = require('./SSHLib');
var Hosts = require('../models/Host');
var Log = require('../models/Log');

var actions = new Actions();

function Actions () {

}

Actions.prototype.createLog = function(options) {
  Hosts.findOne({host: options.host}, function(err, host) {
    Log.create({
      user: options.username,
      hostname: host.hostname,
      hostgroup: host.hostgroup,
      actiontype: options.actiontype,
      action: options.action,
      output: options.output.join('\n'),
      error: options.error
    }, function(err, log) {
      if (err) console.log(err);
    });
  });
};

Actions.prototype.command = function(info, servers, username) {
  var command = info.data.command;
  console.log("WTFBOOM", command);
  var self = this;
  Hosts.find({ 'hostname': { $in: servers }}, function(err, hosts) {
    var ConnectionPool = new SSHPool(hosts);
    var callback = function(conn) {
      var options = {
        host: conn.config.host,
        username: username,
        output: [],
        error: false,
        actiontype: 'command',
        action: command
      };
      conn.exec(command, function(err, stream) {

        stream.on('data', function(data) {
          options.output.push(data.toString());
        });

        stream.stderr.on('data', function(data) {
          options.error = true;
          options.output.push("ERROR: " + data.toString());
        });

        stream.on('close', function() {
          conn.end();
        });
      });

      conn.on('error', function(err) {
        console.log("CONNECTION ERROR " + conn.config.host, err);
      });

      conn.on('close', function() {
        self.createLog(options);
      });
    };

    var closeback = function() {
      ConnectionPool.removeListener('ready', callback);
      ConnectionPool.removeListener('close', closeback);
    };

    ConnectionPool.on('ready', callback);
    ConnectionPool.on('close', closeback);

    ConnectionPool.connect();
  });
};

Actions.prototype.put = function(servers, localpath, remotepath, username) {
  var self = this;
  Hosts.find({ 'hostname': { $in: servers }}, function(err, hosts) {
    var ConnectionPool = new SSHPool(hosts);
    var callback = function(conn) {
      var options = {
        host: conn.config.host,
        username: username,
        output: [],
        error: false,
        actiontype: 'put',
        action: localpath
      };

      conn.sftp(function(err, sftp) {

        sftp.fastPut(localpath, remotepath, function(err) {
          if (err) {
            options.error = true;
            options.output.push(err);
          } else {
            options.output.push('Uploaded ' + localpath + ' to ' + remotepath);
          }
          conn.end();
        });
      });

      conn.on('error', function(err) {
        console.log("CONNECTION ERROR " + conn.config.host, err);
      });

      conn.on('close', function() {
        self.createLog(options);
      });
    };

    var closeback = function() {
      ConnectionPool.removeListener('ready', callback);
      ConnectionPool.removeListener('close', closeback);
    };

    ConnectionPool.on('ready', callback);
    ConnectionPool.on('close', closeback);

    ConnectionPool.connect();
  });
};

Actions.prototype.findFolder = function() {

};


module.exports = actions

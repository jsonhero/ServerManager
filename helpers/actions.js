var SSHPool = require('./SSHLib');
var Hosts = require('../models/Host');
var Log = require('../models/Log');
var fs = require ('fs');
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

Actions.prototype.screen = function(info, servers, username) {
  console.log('We got here');
  var screenAction = info.data.screenAction;
  var self = this;
  Hosts.find({ 'hostname': { $in: servers }}, function(err, hosts) {
    var ConnectionPool = new SSHPool(hosts);

    var callback = function(conn) {
      var options = {
        host: conn.config.host,
        username: username,
        output: [],
        error: false,
        actiontype: 'screen',
        action: screenAction
      };

      conn.cd('/game/servers/', function(err, list) {
        conn.sftp(function(err, sftp) {
          for (var i = 0; i < list.length; i++) {
            var item = list[i];
            if (item.attrs.isDirectory()) {
              var path = conn.currentPath + item.filename + '/'
              conn.findFile(sftp, path, 'run.sh', function(err, file) {
                if (err) {
                  options.error = true;
                  options.output.push("ERROR: " + err);
                  return;
                }

                var stopcommand = "screen -S " + file.path + "-X kill";
                var startcommand = 'cd ' + path + '; screen -S ' + file.path + ' ./run.sh';

                if (screenAction == 'start') {
                  runCommand(startcommand);
                } else if (screenAction == 'stop') {
                  runCommand(stopcommand);
                } else if (screenAction == 'restart') {
                  runCommand(stopcommand);
                  runCommand(startcommand);
                }

                function runCommand(cmd) {
                  conn.exec('ls', function(err, stream) {
                    if (err) {
                      console.log('dafuq', err);
                      return;
                    }
                    var error = '';
                    stream.on('data', function(data) {
                      options.output.push(data.toString());
                    });

                    stream.stderr.on('data', function(data) {
                      error += data;
                      options.error = true;
                    });

                    stream.stderr.on('end', function() {
                      options.output.push(error);
                    });

                    stream.on('close', function() {
                      if (!options.error) {
                        options.output.push(screenAction + " for server " + file.path + " was successful.");
                      }
                    });
                  });
                }
              });
            }
          }
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

Actions.prototype.jar = function(info, servers, username) {
  var jars = JSON.parse(fs.readFileSync('jars.json', {encoding: 'utf8'}));

  var jar = jars.filter(function(jar) {
    if (jar.name == info.data.jar) {
      return jar;
    }
  })[0];
  var self = this;
  Hosts.find({ 'hostname': { $in: servers }}, function(err, hosts) {
    var ConnectionPool = new SSHPool(hosts);

    var callback = function(conn) {

      var options = {
        host: conn.config.host,
        username: username,
        output: [],
        error: false,
        actiontype: 'jar',
        action: info.data.jar
      };

      conn.cd('/game/servers/', function(err, list) {
        for (var i = 0; i < list.length; i++) {
          var item = list[i];
          if (item.attrs.isDirectory()) {
            console.log(conn.currentPath, "WATT");
            conn.findFolder(conn.currentPath + item.filename + '/', 'plugins', function(err, folder) {
              if (err) {
                options.error = true;
                options.output.push("ERROR: " + err);
                return;
              }
              var command = 'cd ' + folder.path + '; curl -O ' + jar.link + ' --fail --silent --show-error';
              console.log(command, 'COMMAND');
              conn.exec(command, function(err, stream) {
                var error = '';
                stream.on('data', function(data) {
                  options.output.push(data.toString());
                });

                stream.stderr.on('data', function(data) {
                  error += data;
                  options.error = true;
                });

                stream.stderr.on('end', function() {
                  options.output.push(error);
                });

                stream.on('close', function() {
                  if (!options.error) {
                    options.output.push('Copy of ' + jar.name + '.jar to ' + folder.path + ' was successful.');
                  }
                  conn.end();
                });
              });
            });
          }
        }
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

Actions.prototype.command = function(info, servers, username) {
  var command = info.data.command;
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
        var error = '';
        stream.on('data', function(data) {
          options.output.push(data.toString());
        });

        stream.stderr.on('data', function(data) {
          error += data;
          options.error = true;
        });

        stream.stderr.on('end', function() {
          options.output.push(error);
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

var SSHPool = require('./SSHLib');
var Hosts = require('../models/Host');
var Log = require('../models/Log');
var fs = require ('fs');

function Actions () {
  this.endOfInput = new RegExp("[>$%#]\\s$");
  this._error = '';
  this._buffer = '';
  this.commands = [];
  this.exitState = false;
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
  var screenAction = info.data.screenAction;
  var self = this;
  var commands = [];
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
          conn.shell(function(err, stream) {
            var endOfInput = new RegExp("[>$%#]\\s$");
            var error = '';
            var buffer = '';
            var exit = false;

            function _processData(data) {
              buffer += data;
              if (endOfInput.test(buffer) && exit) {
                options.output.unshift(buffer.toString());
                conn.end();
              }
              if (endOfInput.test(buffer) && commands.length > 0) {
                buffer = '';
                var command = commands.shift();
                options.output.push(command.info);
                stream.write(command.execute);
              } else if (endOfInput.test(buffer) && commands.length === 0 && dirNum == dirCount) {
                buffer = '';
                exit = true;
                stream.write('screen -ls' + "\n");
              }
            }

            stream.on('readable', function() {
              var chunk, results;
              try {
                results = [];
                while ((chunk = stream.read())) {
                  results.push(_processData("" + chunk));
                }
                return results;
              } catch(e)  {
                console.log("There was an error: " + e);
              }
            });

            stream.stderr.on('data', function(err) {
              error += data;
              options.error = true;
            });

            stream.stderr.on('end', function() {
              options.output.push(error);
            });

            stream.on('close', function() {
              if (!options.error) {
              }
            });


          var dirCount = 0, dirNum = 0;
          for (var i = 0; i < list.length; i++) {
            if (list[i].attrs.isDirectory()) {
              dirCount++;
            }
          }

          for (var i = 0; i < list.length; i++) {
            var item = list[i];
            if (item.attrs.isDirectory()) {
              var path = conn.currentPath + item.filename + '/'
              conn.findFile(sftp, path, 'run.sh', function(err, file) {
                dirNum++;
                if (err) {
                  options.error = true;
                  options.output.push("ERROR: " + err);
                  return;
                }

                var servername = file.path.match(/(server\d+)/)[1];
                var stopcommand = "screen -X -S " + servername + "-1 quit";
                var startcommand = 'cd ' + file.path + '; screen -dmS ' + servername + '-1 ./run.sh';
                var command = {};
                command.info = 'Server ' + servername + ' did ' + screenAction + ' successfully.';

                if (screenAction == 'start') {
                  command.execute = startcommand + "\n";
                  commands.push(command);
                } else if (screenAction == 'stop') {
                  command.execute = stopcommand + "\n";
                  commands.push(command);
                } else if (screenAction == 'restart') {
                  command.execute = stopcommand + " ; " + startcommand + "\n";
                  commands.push(command);
                }

                if (dirNum == dirCount) {
                  buffer = '';
                  options.output.push(commands[0].info);
                  stream.write(commands[0].execute);
                  commands.shift();
                }
              });
            }
          }
        });
      })
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
      var commands = [], cmdCount = 0;

      var options = {
        host: conn.config.host,
        username: username,
        output: [],
        error: false,
        actiontype: 'jar',
        action: info.data.jar
      };


      conn.cd('/game/servers/', function(err, list) {
        conn.sftp(function(err, sftp) {
          conn.shell(function(err, stream) {
            var endOfInput = new RegExp("[>$%#]\\s$");
            var error = '';
            var buffer = '';

            function _processData(data) {
              buffer += data;
              if (endOfInput.test(buffer) && commands.length > 0) {
                buffer = '';
                var command = commands.shift();
                options.output.push(command.info);
                stream.write(command.execute);
              } else if (endOfInput.test(buffer) && commands.length === 0 && dirNum == dirCount) {
                conn.end();
              }
            }

            stream.on('readable', function() {
              var chunk, results;
              try {
                results = [];
                while ((chunk = stream.read())) {
                  results.push(_processData("" + chunk));
                }
                return results;
              } catch(e)  {
                console.log("There was an error: " + e);
              }
            });

            stream.stderr.on('data', function(err) {
              error += data;
              options.error = true;
            });

            stream.stderr.on('end', function() {
              options.output.push(error);
            });

            stream.on('close', function() {
              if (!options.error) {
              }
            });

            var dirCount = 0, dirNum = 0;
            for (var i = 0; i < list.length; i++) {
              if (list[i].attrs.isDirectory()) {
                dirCount++;
              }
            }

            for (var i = 0; i < list.length; i++) {
              var item = list[i];
              if (item.attrs.isDirectory()) {
                conn.findFolder(sftp, conn.currentPath + item.filename + '/', 'plugins', function(err, folder) {
                  dirNum++;
                  if (err) {
                    console.log(err);
                    options.error = true;
                    options.output.push("ERROR: " + err);
                    return;
                  }
                  if (folder == null) {
                    return;
                  }
                  var command = {
                    execute: 'cd ' + folder.path + '; curl -O ' + jar.link + ' --fail --silent --show-error' + '\n',
                    info: 'Copy of ' + jar.name + '.jar to ' + folder.path + ' was successful.'
                  }

                  commands.push(command);
                  if (dirNum == dirCount) {
                    buffer = '';
                    options.output.push(commands[0].info);
                    stream.write(commands[0].execute);
                    commands.shift();
                  }
                });
              }
            }
          });
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

Actions.prototype.put = function(info, servers, username) {
  var localpath = info.data.localpath;
  var remotepath = info.data.remotepath;
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

Actions.prototype.copy = function(info, servers, username) {
  var pathname = info.data.pathname, copyfile = info.data.copyfile;
  if (pathname == '') {
    pathname = '/';
  }


  var self = this, commands = [];
  Hosts.find({ 'hostname': { $in: servers }}, function(err, hosts) {
    var ConnectionPool = new SSHPool(hosts);

    var callback = function(conn) {
      var options = {
        host: conn.config.host,
        username: username,
        output: [],
        error: false,
        actiontype: 'copy',
        action: 'Copy ' + copyfile + ' to ' + pathname
      };

      conn.sftp(function(err, sftp) {
        sftp.opendir('/game/servers/', function(err, buffer) {
          sftp.readdir(buffer, function(err, list) {
            conn.shell(function(err, stream) {
              var endOfInput = new RegExp("[>$%#]\\s$");
              var error = '';
              var buffer = '';

              function _processData(data) {
                buffer += data;
                if (endOfInput.test(buffer) && commands.length > 0) {
                  buffer = '';
                  var command = commands.shift();
                  stream.write(command.execute);
                } else if (endOfInput.test(buffer) && commands.length === 0 && dirNum == dirCount) {
                  conn.end();
                }
              }

              stream.on('readable', function() {
                var chunk, results;
                try {
                  results = [];
                  while ((chunk = stream.read())) {
                    results.push(_processData("" + chunk));
                  }
                  return results;
                } catch(e)  {
                  console.log("There was an error: " + e);
                }
              });

              stream.stderr.on('data', function(err) {
                error += data;
                options.error = true;
              });

              stream.stderr.on('end', function() {
                options.output.push(error);
              });

              stream.on('close', function() {
                if (!options.error) {
                }
              });

            var dirCount = 0, dirNum = 0;
            for (var i = 0; i < list.length; i++) {
              if (list[i].attrs.isDirectory()) {
                dirCount++;
              }
            }

            for (var i = 0; i < list.length; i++) {
              var item = list[i];
              if (item.attrs.isDirectory()) {
                var serverFolder = '/game/servers/' + item.filename + '/', path;
                pathname = pathname.split('');
                if (pathname[0] == '/') pathname.shift();
                if (pathname[pathname.length -1] == '/') pathname.pop();
                pathname = pathname.join('');
                var match = pathname.match(/\/(\w+$)/);
                if (match) {
                    serverFolder += pathname.slice(0, match.index + 1)
                    path = match[1];
                }
                conn.findFolder(sftp, serverFolder, (path || pathname), function(err, folder, sFold) {
                  if (!folder) {
                    options.error = true;
                    options.output.push('Path does not exist for ' + sFold);
                    dirCount--;
                    return;
                  }

                  function copyFile() {
                    var copypath = sFold + (path || pathname) + '/' + copyfile;

                      sftp.fastPut('/Users/jasonbratt/Sites/ServerManager/copy/' + copyfile, copypath, function(err) {
                        dirNum++;
                        if (err) {
                          options.error = true;
                          options.output.push(err);
                        } else {
                          if (copyfile.indexOf('.zip') != -1) {
                            var command = 'cd ' + sFold + (path || pathname) + '/' + '; unzip -o ' + copyfile + '; /bin/rm ' + copyfile + '\n';
                            commands.push(command);
                          }
                          options.output.push('Copied ' + copyfile + " to " + copypath);
                        }

                        if (dirNum == dirCount) {
                          if (commands.length < 1) {
                            conn.end()
                          } else {
                            buffer = '';
                            stream.write(commands[0]);
                            commands.shift();
                          }
                        }
                      });
                  }

                  sftp.opendir(folder.path, function(err, buffer) {
                    sftp.readdir(buffer, function(err, list) {
                      for (var i = 0; i < list.length; i++) {
                        var file = list[i];
                        var hit = false;
                        if (file.filename == copyfile && file.attrs.isDirectory()) {
                          hit = true;
                          }
                        }
                        if (hit) {
                          sftp.rmdir(folder.path + copyfile, function(err) {
                            copyFile();
                          });
                        } else {
                          copyFile();
                        }
                      });
                    });
                  });
                }
              }
            });
          });
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


module.exports = new Actions();

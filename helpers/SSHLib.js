'use strict'

var Promise = require('bluebird');
var Client = require('ssh2');
var events = require('events');

Client.currentPath = '';

var MutableInt = function (start) {
  this.value = start;
  this.increment = function() {
    this.value++;
  }
}

Client.prototype.findFolderRecursive = function(path, folder, callback) {
  this.currentPath = path;
  this.sftp(function(err, sftp) {
    var hits = [];
    var findFolder = readFolder(path);

    findFolder.then(function() {
      callback(err, hits);
    });

    function readFolder(fpath) {
      return new Promise(function(resolve, reject) {
      sftp.opendir(fpath, function(err, buffer) {
        sftp.readdir(buffer, function(err, files) {

        if (files.length < 1) {
          resolve(null);
          return;
        }
        var accum = new MutableInt(0);

        files.forEach(function(fold, i) {
          if (fold.attrs.isDirectory()) {
            if (fold.filename == folder) {
              fold.path = fpath + '/' + fold.filename
              hits.push(fold);
            }
            readFolder(fpath + '/' + fold.filename).then(function(val) {
              accum.increment();
              if (accum.value == files.length) {
                resolve(null);
              }
            }).catch(function(e) { console.log(e); });
          }
        });
      });
    });
  })
  };
  });
};

Client.prototype.cd = function(path, callback) {
  this.currentPath = path;
  this.sftp(function(err, sftp) {
    sftp.opendir(path, function(err, buffer) {
      sftp.readdir(buffer, function(err, list) {
        callback(err, list);
      });
    });
  });
};

Client.prototype.findFolder = function(path, folder, callback) {
  this.sftp(function(err, sftp) {
    sftp.opendir(path, function(err, buffer) {
      console.log(path, err);
      sftp.readdir(buffer, function(err, list) {
        var foundFolder = null;
        for (var i = 0; i < list.length; i++) {
          var file = list[i];
          if (file.attrs.isDirectory() && file.filename == folder) {
            file.path = path + file.filename;
            foundFolder = file;
            break;
          }
        };
        callback(err, foundFolder)
      });
    });
  });
};

Client.prototype.findFile = function(sftp, path, file, callback) {
  sftp.opendir(path, function(err, buffer) {
    sftp.readdir(buffer, function(err, list) {
      var foundFile = null;
      for (var i = 0; i < list.length; i++) {
        var Searchfile = list[i];
        if (Searchfile.attrs.isFile() && Searchfile.filename == file) {
          Searchfile.path = path + Searchfile.filename;
          foundFile = Searchfile;
          break;
        }
      };
      callback(err, foundFile)
    });
  });
};

Client.prototype.fileCount = function(path, callback) {
  this.cd(path, function(err, list) {
    callback(err, list.length);
  });
};

Client.prototype.writeFile = function(path, text, options) {
  this.currentPath = path;
  if (!options) {
    options = {};
  }
  this.sftp(function(err, sftp) {
    var writer = sftp.createWriteStream(path, options);
    writer.write(text);
    writer.end();
  });
};


var SSHPool = function(hosts) {
  events.EventEmitter.call(this);

  this._hosts = hosts.map(function(host) {
    return new Host(host);
  });
};

SSHPool.prototype.__proto__ = events.EventEmitter.prototype;


SSHPool.prototype.connect = function() {
  this._hosts.forEach(function(host) {
    host.connect(this);
  }.bind(this));
};

var Host = function(options) {
  this._client = new Client();
  this.connected = null;
  this.host = options.host;
  this.port = options.port;
  this.username = options.username;
  this.password = options.password;

};

Host.prototype.connect = function(SSHPool) {
  var self = this;
  this._client.on('ready', function() {
    console.log('test');
    self.connected = true;
    SSHPool.emit('ready', this);
  });


  this._client.on('close', function() {
    self.connected = false;
    var connections = SSHPool._hosts.every(function(host) {
      if (host.connected === false) {
        return true;
      }
    });
    if (connections) {
      SSHPool.emit('close');
    }
    this.removeAllListeners('ready');
    this.removeAllListeners('close');
  });

  this._client.connect({
    host: this.host,
    username: this.username,
    password: this.password,
    port: this.port
  });
};

module.exports = SSHPool;

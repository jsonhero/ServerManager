var archiver = require('archiver');
var fs = require('fs');
var rimraf = require('rimraf');

Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths
    if (this.length != array.length)
        return false;

    for (var i = 0, l=this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;
        }
        else if (this[i] != array[i]) {
            return false;
        }
    }
    return true;
}
Object.defineProperty(Array.prototype, "equals", {enumerable: false});

var Watcher = function(options) {
  this.watching = options.watching;
  this.checkInterval = options.checkInterval;
  this.contents = [];

  this.msg('Watcher started.');
  this.checker();
}

Watcher.prototype.read = function() {
  var self = this;
  var dirContents = fs.readdirSync(self.watching);
  if (!this.contents.equals(dirContents)) {
    this.msg('Found a difference in watch folder, checking for files to zip.');
    this.contents = dirContents;
    this.zipFolder();
  }
}

Watcher.prototype.checker = function() {
  var self = this;
  setInterval(function() {
    self.read();
  }, this.checkInterval);
}

Watcher.prototype.msg = function(msg) {
  console.log("-*- AutoZipper :: watcher on " + this.watching + "\n  " + msg);
  console.log("-*-")
}

Watcher.prototype.zipFolder = function(callback) {
  var self = this;
  this.contents.forEach(function(file) {
    var path = self.watching + file;
    fs.stat(path, function(err, stats) {
      if (stats.isDirectory()) {
        fs.access(path + '.zip', fs.F_OK, function(err) {
          if (err) {
            var outputPath = path + '.zip';
            var output = fs.createWriteStream(outputPath);
            var zipArchive = archiver('zip');

            output.on('close', function() {
              rimraf(path, function(e) {
                console.log('error?', e);
                self.msg('Zipped and removed original folder for ' + outputPath);
              });
            });

            zipArchive.pipe(output);

            zipArchive.bulk([
                { src: [ '**/*' ], cwd: path, dest: file, expand: true }
            ]);

            zipArchive.finalize(function(err, bytes) {
                if(err) {
                  throw err;
                }
                console.log('done:', bytes);
            });
          }
        });
      }
    });
  });
}

module.exports = Watcher;

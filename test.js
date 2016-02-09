var fs = require('fs');

var dirContents = fs.readdirSync('./copy');
console.log(dirContents);

var mongoose = require('mongoose');


var HostSchema = new mongoose.Schema({
  host: String,
  hostname: String,
  hostgroup: String,
  username: { type: String, default: 'root'},
  password: String,
  port: { type: Number, default: 22}
});


module.exports = mongoose.model('Host', HostSchema, 'hosts');

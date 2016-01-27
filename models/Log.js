var mongoose = require('mongoose');

var LogSchema = new mongoose.Schema({
  user: { type: String, default: 'N/A'},
  hostname: String,
  hostgroup: String,
  actiontype: String,
  action: { type: String, default: ''},
  output: String,
  error: Boolean,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Log', LogSchema, 'logs');

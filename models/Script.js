var mongoose = require('mongoose');

var ActionSchema = new mongoose.Schema({
  type: String,
  info: String,
  data: {}
});

var ScriptSchema = new mongoose.Schema({
  name: String,
  actions: [ActionSchema]
});



module.exports.Action = mongoose.model('Action', ActionSchema, 'actions');
module.exports.Script = mongoose.model('Script', ScriptSchema, 'scripts');

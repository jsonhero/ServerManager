var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
  hostname: String,
  password: String,
  email: String
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('Log', UserSchema, 'logs');

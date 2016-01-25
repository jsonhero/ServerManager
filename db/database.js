var mongoose = require('mongoose');
var connectionString = process.env.DATABASE_URL;

// define connection string.  'production' will be set if deployed on heroku
if(process.env.NODE_ENV === 'production'){
  connectionString = process.env.MONGOLAB_URI;
}

// alternate way to define string as in class
// var connectionString = process.env.DATABASE_URL || process.env.MONGOLAB_URI;

mongoose.connect(connectionString);

mongoose.connection.on('connected', function() {
  console.log("Connected to Database >> servermanager");
});

mongoose.connection.on('disconnected', function() {
  console.log("Disconneced From Database >> servermanager")
});

mongoose.connection.on('error', function() {
  console.log('There was an error in the database!');
});

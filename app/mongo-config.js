//creates connection to mongoDB database using mongoose ORM

var mongoose = require('mongoose');
var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');


var mongoURI = 'mongodb://localhost/shortly';
mongoose.connect(mongoURI);

var db = mongoose.connection;
db.on('error', function() {
  console.log('MongoDB error.');
});
db.on('open', function() {
  console.log('MongoDB open.');
});

//========================================================

//creates url schema for url-links
var urlSchema = new mongoose.Schema({
  url: String,
  base_url: String,
  code: String,
  title: String,
  visits: {type: Number, default: 0}
});

//shortens url into a code property before saving to database
urlSchema.pre('save', function(next) {
  var shasum = crypto.createHash('sha1');
  shasum.update(this.url);
  this.code = shasum.digest('hex').slice(0, 5);
  next();
});

//exports model created from schema
exports.Link = mongoose.model('Url', urlSchema);

//========================================================

//creates user schema
var userSchema = new mongoose.Schema({
  username: {type: String, required: true, index: {unique: true}},
  password: {type: String, required: true}
});

//hashes user password before saving to database using bcrypt without salting
userSchema.pre('save', function(next) {
  var cipher = Promise.promisify(bcrypt.hash);
  cipher(this.password, null, null).bind(this)
    .then(function(hash) {
      this.password = hash;
    }).then(next);
});

//method for documents to compare password to the hashed password in the database on login
userSchema.methods.comparePassword = function(attemptedPassword, cb){
  bcrypt.compare(attemptedPassword, this.password, function(err, isMatch) {
    cb(isMatch);
  });
};

//exports model created from schema
exports.User = mongoose.model('User', userSchema);

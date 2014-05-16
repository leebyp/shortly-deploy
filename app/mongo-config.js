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

var urlSchema = new mongoose.Schema({
  url: String,
  base_url: String,
  code: String,
  title: String,
  visits: {type: Number, default: 0}
});

urlSchema.pre('save', function(next) {
  var shasum = crypto.createHash('sha1');
  shasum.update(this.url);
  this.code = shasum.digest('hex').slice(0, 5);
  next();
});

exports.Link = mongoose.model('Url', urlSchema);

//========================================================

var userSchema = new mongoose.Schema({
  username: {type: String, required: true, index: {unique: true}},
  password: {type: String, required: true}
});

userSchema.pre('save', function(next) {
  var cipher = Promise.promisify(bcrypt.hash);
  cipher(this.password, null, null).bind(this)
    .then(function(hash) {
      this.password = hash;
    }).then(next);
});

userSchema.methods.comparePassword = function(attemptedPassword, cb){
  bcrypt.compare(attemptedPassword, this.password, function(err, isMatch) {
    cb(isMatch);
  });
};

exports.User = mongoose.model('User', userSchema);

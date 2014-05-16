var request = require('request');
var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var util = require('../lib/utility');

var db = require('../app/mongo-config');

exports.renderIndex = function(req, res) {
  res.render('index');
};

exports.signupUserForm = function(req, res) {
  res.render('signup');
};

exports.loginUserForm = function(req, res) {
  res.render('login');
};

exports.logoutUser = function(req, res) {
  req.session.destroy(function(){
    res.redirect('/login');
  });
};

//fetch all links from mongoDB
exports.fetchLinks = function(req, res) {

  db.Link.find().exec(function(err, links) {
    if(err) {
      console.log('Query error: ', err);
    }
    else {
      res.send(200, links);
    }
  });

};

//save link to mongoDB
exports.saveLink = function(req, res) {
  var uri = req.body.url;

  //checks validity of url
  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  //checks if url already exists in database
  db.Link.findOne({url: uri}, function(err, found){
    if(err) {
      console.log('Query error: ', err);
    } else {
      //link already in database
      if (found) {
        console.log('found url already, found', found)
        res.send(200, found);
      } else {
        util.getUrlTitle(uri, function(err, title) {
          if (err) {
            console.log('Error reading URL heading: ', err);
            return res.send(404);
          } else {
            //save new link to the database
            var link = new db.Link({
              url: uri,
              title: title,
              base_url: req.headers.origin
            });

            link.save(function(err, link) {
              if (err) {
                console.log('error in saving', err);
              } else {
                res.send(200, link);
                console.log('link', link);
              }
            });
          }
        });
      }
    }
  });

};

//login user
exports.loginUser = function(req, res) {

  var username = req.body.username;
  var password = req.body.password;

  //checks username against database
  db.User.findOne({username: username}, function(err, user) {
    if(err) {
      console.log('Error with signup query: ', err);
    } else {
      if(user) {
        //if users exists, checks password and creates session
        user.comparePassword(password, function(match) {
          if (match) {
            util.createSession(req, res, user);
          } else {
            res.redirect('/login');
          }
        });
      } else {
      res.redirect('/login');
      }
    }
  });
};

//signup user
exports.signupUser = function(req, res) {

  var username = req.body.username;
  var password = req.body.password;

  //checks if user exists already
  db.User.findOne({username: username}, function(err, found) {
    if(err) {
      console.log('Error with signup query: ', err);
    } else {
      if(found) {
        console.log('Account already exists');
        res.redirect('/signup');
      } else {
        //creates new user and adds to database
        var newUser = new db.User({
          username: username,
          password: password
        });
        newUser.save(function(err, user) {
          util.createSession(req, res, user);
        });
      }
    }
  });
};

//redirect to shortened link created
exports.navToLink = function(req, res) {

  //checks in database for real long url
  db.Link.findOne({code: req.params[0]}, function(err, link){
    if (err){
      console.log('Error with navigating to link', err);
    } else {
      if (!link){
        //link doesnt exist
        res.redirect('/');
      } else {
        //updates number of visits, save to database and redirects user
        link.visits++;
        link.save();
        return res.redirect(link.url);
      }
    }
  });
};

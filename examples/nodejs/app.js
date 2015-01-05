'use strict';

var util     = require('util');
var express  = require('express');
var mongoose = require('mongoose');

// We can create a 'subclass' of 'Error' like this. HTTPError will still be an
// instance of Error if anyone asks this.
function HTTPError(status, message) {
	// We call our 'super' constructor.
	Error.call(this);
	// This part here is a bit magical. We need to capture the current stack
	// trace. It is easy, since we know the name of the function we are
	// executing.
	Error.captureStackTrace(this, HTTPError);

	// We set our own extra stuff.
	this.status  = status;
	this.message = message;
}

// Magical!
util.inherits(HTTPError, Error);

// Let's connect to the database and define our models. Note that you might
// want to actually handle the possible errors with the database connection.
// Since 'connect' returns 'this', we can chain the call to 'model'.
mongoose.connect('mongodb://localhost')
	.model('user', require('./schemas/user'));

// We create a separate 'router', on which we can mount handlers for specified
// paths. These handlers are often called 'middleware' in NodeJS-land.
var app    = express();
var router = express.Router();

// We need to add a 'body-parser' module as middleware for express, in order to
// populate the 'req.body' for requests. Specifically 'application/json'.
app.use(require('body-parser').json());

// We can mount 'middleware' on the router, just like we would on the 'app'.
// Let's mount our handlers. Notice the (req, res, next) signature.

router.get('/users', function getUsers(req, res, next) {
	// We do a query on the 'user' collection (model), with no arguments in
	// order to retrieve all results.
	mongoose.model('user').find(null, function(err, users) {
		// If there is an error, it must be something fucky, since mongoose
		// will return an empty array if there are no users, not an error.
		if(err) {
			return next(new HTTPError(500, err.message));
		}
		return res.status(200).json(users);
	});
});

router.get('/users/:id', function getUserById(req, res, next) {
	if(!mongoose.Types.ObjectId.isValid(req.params.id)) {
		return next(new HTTPError(400, 'Invalid ObjectId'));
	}
	// We do a query for a specific user by '_id'.
	mongoose.model('user').findOne({ '_id': req.params.id },
		function(err, user) {
			if(err) {
				return next(new HTTPError(500, err.message));
			}
			if(!user) {
				return next(new HTTPError(404, 'User not found!'));
			}
			return res.status(200).json(user);
		});
});

router.post('/users', function AddUser(req, res, next) {
	// We create a new 'user'!
	var User = mongoose.model('user');
	var user = new User({ name: req.body.name, tags: req.body.tags });

	// But then we need to persist it in the database...
	user.save(function(err, user) {
		if(err) {
			// Maybe they made a 'human' error with invalid data. We really
			// should check in a real application.
			return next(new HTTPError(400, 'Maybe bad payload. :-)'));
		}
		return res.status(201).json(user);
	});
});

// We mount the created router like any other handler! Think of the router as
// a mini 'application' that just doesn't do anything by itself.
app.use(router);

// Let's mount an error handling function for our application. Any time a
// 'middleware' invokes 'next' with an error, this gets called.
app.use(function onError(err, req, res, next) {
	// Make sure there is an error status!
	err.status = err.status || 500;
	// Log our error!
	console.error('[ERROR][' + err.status +  ']', err.message);
	// If something truly goes wrong, we don't want to pass on the message to
	// the clients, we just log it!
	if(err.status >= 500) {
		err.message = 'Internal server error.';
	}
	return res.status(err.status).send(err.message);
});

// We expose the 'app' as a requirable module. See 'app.js' for implementation!
module.exports = app;

'use strict';

var mongoose = require('mongoose');

/**
 * We create a 'requireable' module, which defines our 'User' model.
 */
var UserSchema = module.exports = new mongoose.Schema({

	/**
	 * The user's name.
	 */
	'name': {
		'type': String,
	},

	/**
	 * The tags related to the user. Note the array definition. Also note the
	 * 'trim' and 'lowercase' options, read the documentation for explanation.
	 */
	'tags': [{
		'type':      String,
		'trim':      true,
		'lowercase': true,

	}]
});

// We can specify both 'toJSON' and 'toObject' transforms for the schema. This
// will control how the output object will look like in JSON for example.

if(!UserSchema.options.toJSON) UserSchema.options.toJSON = { }

UserSchema.options.toJSON.transform = function(doc, ret) {
	ret.id = doc.id;

	delete ret._id;
	delete ret.__v;
}

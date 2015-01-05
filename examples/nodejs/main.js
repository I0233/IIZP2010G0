'use strict';

var app  = require('./app');
var port = process.env.PORT || 8080;

// We invoke the express shorthand for starting the server.
app.listen(port, function onListen(err) {
	if(err) {
		return console.error(err);
	}
	return console.log('Server listening at', port);
});

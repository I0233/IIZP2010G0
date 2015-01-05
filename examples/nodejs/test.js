'use strict';

var app     = require('./app');
var should  = require('should');
var request = require('supertest');

// Sample tests, write some proper ones for your real application.
describe('Basic functionality', function() {

	var testUserID = null;

	it('should create a new user', function(done) {
		request(app)
			.post('/users')
			.send({ 'name': 'ismo', 'tags': ['talon', 'mies'] })
			.expect(201, done);
	});

	it('should retrieve all the users', function(done) {
		request(app)
			.get('/users')
			.expect(200, function(err, res) {
				if(err) {
					return done(err);
				}

				console.log(res.body);

				var users = res.body;

				// You can use 'should' in the following ways:
				//
				// a) It can be used statically. Like this!
				should(users).be.instanceOf(Array);

				// b) It extends the 'Object' prototype with should, so this
				//    should work (no pun intended). This is the more usual
				//    approach!!
				//
				// should(users).be.instanceOf(Array);

				// We store the 'id' attribute for future tests.
				testUserID = users[0].id;

				return done();
			});
	});

	it('should retrieve a specific user', function(done) {
		request(app)
			.get('/users/' + testUserID + '')
			.expect(200, function(err, res) {
				if(err) {
					return done(err);
				}

				var user = res.body;

				user.should.be.an.Object.and.have.properties([
					'id', 'name', 'tags']);

				user.id.should.be.instanceOf(String);
				user.name.should.be.instanceOf(String).and.equal('ismo');
				user.tags.should.be.instanceOf(Array).and.containEql('talon');
				user.tags.should.be.instanceOf(Array).and.containEql('mies');

				return done();
			});
	});
});

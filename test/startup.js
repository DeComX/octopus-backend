const mongoose = require('mongoose');
const server = require('../server');

// Clean up test database before running each test.
afterEach((done) => {
	mongoose.connect("mongodb://localhost/decom");
	mongoose.connection.once('open', () => {
		mongoose.connection.dropCollection('groups', (err, result) => {
			mongoose.connection.dropCollection('access_controls', (err, result) => {
	        	done();
	        });
		});
	}).on('error', (error) => {
		console.log('Connection error:', error);
		done();
	});
});
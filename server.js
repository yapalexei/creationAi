'use strict'
/**
 * Created by afront on 3/6/16.
 */
var opener      = require('opener');
var connect     = require('connect');
var serveStatic = require('serve-static');
connect().use(serveStatic(__dirname)).listen(8080, function () {
    console.log('Server running on 8080...');
    opener('http://0.0.0.0:8080');
});
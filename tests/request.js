var request = require('supertest');
var Logger   = require('../utils/logger.js')
var logger   = new Logger();
var models   = require('../models')(logger);
var Server   = require('../lib/server.js');
var mongoose = require('mongoose');

var server_port = process.env.PORT || 8080;
var mongoose_address = process.env.PROD_MONGODB || 'mongodb://localhost/testDB';

mongoose.connect(mongoose_address, function(){
    logger.info('Соединился с БД, адрес ' + mongoose_address);
});

var server = new Server(server_port, logger);
server.initializeExpress();

module.exports = request(server.app);
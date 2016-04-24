var Logger   = require('./utils/logger.js'),
    logger   = new Logger(),
    models   = require('./models')(logger),
    Server   = require('./lib/server.js'),
    mongoose = require('mongoose');

const serverPort      = process.env.PORT || 8080,
      mongooseAddress = process.env.PROD_MONGODB || 'mongodb://localhost/test';

mongoose.connect(mongooseAddress, function() {
    logger.info('Соединился с БД, адрес ' + mongooseAddress);

    var server = new Server(serverPort, logger);
    server.run()
        .then(function() {
            logger.info('Сервер запущен на порте ' + server.port);
        })
        .catch(function(err) {
            logger.info('Невозможно запустить сервер! ' + err.message);
        });
});

'use strict';

var express      = require('express');
var app          = express();
var Logger       = require('../utils/logger.js');
var Controllers  = require('../controllers');
var MsgGenerator = require('../utils/messagesGenerator.js');
var BodyParser   = require('body-parser');
var multer = require('multer'); // миддлвеар для загрузки файлов

class Server{
    constructor(port, logger){
        this.port   = port;
        this.logger = logger || new Logger();
    }

    initializeExpress() {
        app.use(express.static(__dirname + '/../public'));
        app.use(BodyParser.urlencoded({extended: true}));

        app.use((req, res, next) => {
            this.logger.info(req.method + ' ' + req.url);
            req.logger = this.logger;
            req.msgGenerator = MsgGenerator;
            res.header('Access-Control-Allow-Origin', '*');
            next();
        });

        app.use('/admin',     Controllers.Admin);
        app.use('/auth',      Controllers.Auth);

        app.use('/companies', Controllers.Companies);
        app.use('/stocks',    Controllers.Stocks);
        app.use('/user')

        app.use((req, res) => {
            this.logger.warn('Неизвестный путь запроса ' + req.method + ' ' + req.url);
            var msg = MsgGenerator.generateJSON('Unknown request url', req.method + ' ' + req.url);
            res.status(404).end(msg);
        });

        app.use((err, req, res) => {
            this.logger.error(err);
            var msg = MsgGenerator.generateJSON('error', err.message);
            res.status(500).end(msg);
        });

        this.logger.info('Подключил контроллеры, настроил роуты');
    }

    run() {
        this.initializeExpress();
        app.listen(this.port);
        this.logger.info('Сервер запущен на порте ' + this.port);
    }
}

module.exports = Server;
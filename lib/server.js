'use strict';

var express = require('express');
var app = express();
var Logger = require('../utils/logger.js');
var Controllers = require('../controllers');
var BodyParser = require('body-parser');
var JSONError = require('./json_error');

class Server {
    constructor(port, logger) {
        this.port = port;
        this.logger = logger || new Logger();
        this.app    = app;
    }

    initializeExpress() {
        app.use(express.static(__dirname + '/../public'));
        app.use(BodyParser.urlencoded({extended: true}));

        app.use((req, res, next) => {
            req.logger = this.logger;
            req.logger.info(req.method + ' ' + req.url);
            res.header('Access-Control-Allow-Origin', '*');
            res.set({'content-type': 'application/json; charset=utf-8' })
            res.JSONAnswer = function (type, data, code) {
                var answer = JSON.stringify({
                    'type': type,
                    'data': data
                });
                req.logger.info('Отправляю JSON клиенту: ' +answer);
                res.status(code || 200).end(answer);
            };

            next();
        });


        app.use('/admin', Controllers.Admin);

        app.use('/company', Controllers.Company);
        app.use('/user', Controllers.User);

        app.use((req, res, next) => {
            var jsonError = new JSONError('Unknown request url', req.method + ' ' + req.url, 404);
            next(jsonError);
        });

        app.use((err, req, res, next) => {
            this.logger.error(err);

            if (err instanceof JSONError) {
                this.logger.info('Отправляю клиенту JSON с ошибкой: ' + err.toClient());
                res.status(err.code).end(err.toClient());
                return;
            }

            if (err instanceof Error) {
                this.logger.error(err);
                res.status(500).end('Internal server error');
                return;
            }

            res.status(500).end('Internal server error');
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
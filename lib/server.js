'use strict';

var express     = require('express'),
    Logger      = require('../utils/logger.js'),
    Controllers = require('../controllers'),
    BodyParser  = require('body-parser'),
    JSONError   = require('./json_error');

const PATH_TO_STATIC_CONTENT = __dirname + '/../public';

class Server {
    /**
     * HTTP-сервер на основе Express
     * @param port   - порт, на котором будет запущен сервер
     * @param logger - инстанс логгера для сервера. Инициализируется новый если не был передан
     */
    constructor(port, logger) {
        this.port = port;
        this.logger = logger || new Logger();
        this.app    = express();
    }

    /**
     * Инициализирует Express-сервер
     */
    initializeExpress() {
        this.app.use(express.static(PATH_TO_STATIC_CONTENT));
        this.app.use(BodyParser.urlencoded({extended: true}));

        this.app.use(this._initRequestMiddleware);

        // Контроллеры
        this.app.use('/admin',   Controllers.Admin);
        this.app.use('/company', Controllers.Company);
        this.app.use('/user',    Controllers.User);

        this.app.use(this._notFoundMiddleware);
        this.app.use(this._errorHandlerMiddleware);

        this.logger.info('Подключил контроллеры, настроил роуты');
    }

    /**
     * Стартует сервер и слушает переданный в конструктор порт
     *
     * @returns {Promise} - промис, который резолвится если сервер успешно стартанул,
     * и реджектится с ошибкой в обратном случае
     */
    run() {
        var self = this;

        self.initializeExpress();
        return new Promise(function(resolve, reject) {
            self.app.listen(self.port, function(err) {
                if (err) reject(err);
                resolve(self);
            });
        });
    }

    /**
     * Получает используемую процессом память в мегабайтах
     * @returns {number} Размер используемой памяти в мегабайтах
     */
    getUsedMemoryInMB() {
        return process.memoryUsage().heapUsed / 1024 / 1024;
    }

    /**
     * Миддлвеар, отвечающий за ненайденный ресурс на сервере
     * @param req - объект запроса
     * @param res - объект ответа
     * @param next - функция передачи управления следующему миддлвеару
     * @private
     */
    _notFoundMiddleware(req, res, next) {
        var jsonError = new JSONError('Unknown request url', req.method + ' ' + req.url, 404);
        next(jsonError);
    }

    /**
     * Миддлвеар, отвечающий за обработку ошибок
     * @param err - произошедшая ошибка
     * @param req - объект запроса
     * @param res - объект ответа
     * @param next - функция передачи управления следующему миддлвеару
     * @private
     */
    _errorHandlerMiddleware(err, req, res, next) {
        this.logger.error(err);

        if (err instanceof JSONError) {
            var errorMessage = err.toClient();

            this.logger.info('Отправляю клиенту JSON с ошибкой: ' + errorMessage);
            res
                .status(err.code)
                .end(errorMessage);
            return;
        }

        res.status(500).end('Internal server error');
    }

    /**
     * Миддлвеар, инициализирующий запрос. Логирует информацию о запросе, устанавливает заголовки,
     * добавляет функцию JSONAnswer
     * @param req - объект запроса
     * @param res - объект ответа
     * @param next - функция передачи управления следующему миддлвеару
     * @private
     */
    _initRequestMiddleware(req, res, next) {
        req.logger = this.logger;

        this._logRequestInfo(req);
        this._setHeaders(res);

        res.JSONAnswer = this._generateJSONAnswerFunctionForRequest(req, res);

        next();
    }

    /**
     * Устанавливает предварительные заголовки для ответа
     * @param response - объект ответа клиенту
     * @private
     */
    _setHeaders(response) {
        // Позволяет слать запросы с любого URL
        response.header('Access-Control-Allow-Origin', '*');
        // Тип ответа - JSON
        response.set({'content-type': 'application/json; charset=utf-8' })
    }

    /**
     * Записывает метод, урл и параметры запроса в логи
     * @param request - объект запроса
     * @private
     */
    _logRequestInfo(request) {
        this.logger.info(request.method + ' ' + request.url);

        if (request.method === 'POST') {
            this.logger.inspect('Параметры запроса:', request.body);
        }
    }

    /**
     * Генерирует функцию JSONAnswer для этого запроса
     * @param req - объект запроса
     * @param res - объект ответа
     * @returns {Function} - функция JSONAnswer для этого запроса
     * @private
     */
    _generateJSONAnswerFunctionForRequest(req, res) {
        return function(type, data, code) {
            var answer = JSON.stringify({
                'type': type,
                'data': data
            });

            req.logger.info('Отправляю JSON клиенту: ' +answer);
            res.status(code || 200).end(answer);
        };
    }
}

module.exports = Server;
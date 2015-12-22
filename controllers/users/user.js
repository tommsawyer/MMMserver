var express   = require('express');
var mw        = require('../../utils/middlewares.js');
var mongoose  = require('mongoose');
var Stocks    = require('../models/stocks.js');
var Companies = require('../models/companies.js');

var Client    = mongoose.model('Client');
var router    = express.Router();

router.post('/register', mw.checkLoginAndPassword, (req, res) => {
    Client.byLogin(req.body.login, (err, client) => {
        if (client) {
            req.logger.info('Пользователь с логином ' + req.body.login + ' уже существует');
            res.end(req.msgGenerator.generateJSON('error', 'Пользователь с таким логином уже существует'));
            return;
        }

        var cl = new Client(req.body);
        cl.save((err, client) => {
            if (req.msgGenerator.generateError(err, req, res)) {
                return;
            }

            req.logger.info('Создал нового пользователя ' + client.login);
            res.end(req.msgGenerator.generateJSON('register', client.getToken()));
            req.logger.info('Отправил клиенту токен нового пользователя');
        });
    });
});

router.post('/authorize', mw.checkLoginAndPassword, (req, res) => {
    Client.authorize(req.body.login, req.body.password, (err, client) => {
        if (req.msgGenerator.generateError(err, req, res)) {
            return;
        }

        var token = client.getToken();

        req.logger.info('Авторизовался пользователь ' + req.body.login);
        res.end(req.msgGenerator.generateJSON('token', token));
    });
});

router.use(mw.checkClientToken);
router.use('/stocks', Stocks);
router.use('/companies', Companies);

module.exports = router;

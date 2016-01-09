var express   = require('express');
var mw        = require('../../utils/middlewares.js');
var mongoose  = require('mongoose');
var Stocks    = require('../models/stocks.js');
var Companies = require('../models/companies.js');
var Categories   = require('../models/categories.js');

var Client    = mongoose.model('Client');
var router    = express.Router();

router.post('/register', mw.checkLoginAndPassword, (req, res) => {
    Client.byLogin(req.body.login, (err, client) => {
        if (client) {
            req.logger.info('Пользователь с логином ' + req.body.login + ' уже существует');
            return res.JSONAnswer('error', 'Пользователь с таким логином уже существует');
        }

        var cl = new Client(req.body);
        cl.save((err, client) => {
            if (err) {
                return next(err);
            }

            req.logger.info('Создал нового пользователя ' + client.login);
            res.JSONAnswer('register', client.getToken());
        });
    });
});

router.post('/authorize', mw.checkLoginAndPassword, (req, res) => {
    Client.authorize(req.body.login, req.body.password, (err, client) => {
        if (err) {
            return next(err);
        }

        var token = client.getToken();

        req.logger.info('Авторизовался пользователь ' + req.body.login);
        res.JSONAnswer('token', token);
    });
});

router.use(mw.checkClientToken);
router.use('/stocks', Stocks);
router.use('/companies', Companies);
router.use('/categories', Categories);

module.exports = router;

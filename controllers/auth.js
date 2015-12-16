var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var storages = require('../utils/storages.js');
var Client = mongoose.model('Client');
var Company = mongoose.model('Company');
var checkLoginAndPassword = require('../utils/middlewares').checkLoginAndPassword;
var multer = require('multer'); // миддлвеар для загрузки файлов
var companyLogo = multer({storage: storages.companyStorage});

router.post('/register/user', checkLoginAndPassword, (req, res) => {
    Client.byLogin(req.body.login, (err, client) => {
        if (client) {
            req.logger.info('Пользователь с логином ' + req.body.login + ' уже существует');
            res.end(req.msgGenerator.generateJSON('register', 'Пользователь с таким логином уже существует'));
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

router.post('/register/company', companyLogo.single('logo'), checkLoginAndPassword, (req, res) => {
    if (!req.file) {
        req.logger.info('Нет логотипа при регистрации компании');
        res.end(req.msgGenerator.generateJSON('register', 'Необходим логотип при регистрации компании'));
        return;
    }

    Company.byLogin(req.body.login, (err, company) => {
        if (company) {
            req.logger.info('Компания с логином ' + req.body.login + ' уже существует');
            res.end(req.msgGenerator.generateJSON('register', 'Компания с таким логином уже существует'));
            return;
        }

        Company.create({
            login: req.body.login,
            password: req.body.password,
            name: req.body.name,
            INN: req.body.INN,
            OGRN: req.body.OGRN,
            logo: '/companies/' + req.file.filename
        }, (err, company) => {
            if (req.msgGenerator.generateError(err, req, res)) {
                return;
            }

            req.logger.info('Создал новую компанию ' + company.login);
            res.end(req.msgGenerator.generateJSON('register', company.getToken()));
            req.logger.info('Отправил клиенту токен новой компании');
        });
    });

});

router.post('/authorize/user', (req, res) => {
    Client.authorize(req.body.login, req.body.password, (err, client) => {
        if (req.msgGenerator.generateError(err, req, res)) {
            return;
        }

        var token = client.getToken();

        req.logger.info('Авторизовался пользователь ' + req.body.login);
        res.end(req.msgGenerator.generateJSON('token', token));
    });
});


router.post('/authorize/company', (req, res) => {
    Company.authorize(req.body.login, req.body.password, (err, company) => {
        if (req.msgGenerator.generateError(err, req, res)) {
            return;
        }

        var token = company.getToken();

        req.logger.info('Авторизовалась компания ' + req.body.login);
        res.end(req.msgGenerator.generateJSON('token', token));
    });
});

module.exports = router;

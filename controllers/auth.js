var express               = require('express');
var router                = express.Router();
var mongoose              = require('mongoose');
var storages              = require('../utils/storages.js');
var Client                = mongoose.model('Client');
var Company               = mongoose.model('Company');
var checkLoginAndPassword = require('../utils/middlewares').checkLoginAndPassword;
var multer                = require('multer'); // миддлвеар для загрузки файлов
var companyLogo           = multer({storage: storages.companyStorage});

router.post('/register/user', checkLoginAndPassword, (req, res) => {
    var client = new Client(req.body);

    client.save((err, client) => {
        if (req.msgGenerator.generateError(err, req, res)) {
            return;
        }

        req.logger.info('Создал нового пользователя ' + client.login);
        res.end(req.msgGenerator.generateJSON('register', client.getToken()));
        req.logger.info('Отправил клиенту токен нового пользователя');
    });

});

router.post('/register/company', companyLogo.single('logo'), checkLoginAndPassword, (req, res) => {
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

var express = require('express');
var mongoose = require('mongoose');
var storages = require('../../utils/storages.js');
var mw = require('../../utils/middlewares.js');
var Stocks = require('../models/stocks.js');
var Companies = require('../models/companies.js');
var mail = require('../../utils/mail.js');
var multer = require('multer'); // миддлвеар для загрузки файлов
var companyLogo = multer({storage: storages.companyStorage});
var stockLogo = multer({storage: storages.stockStorage});
var Company = mongoose.model('Company');
var router = express.Router();

router.post('/register', companyLogo.single('logo'), mw.checkLoginAndPassword, (req, res) => {
    if (!req.file) {
        req.logger.info('Нет логотипа при регистрации компании');
        res.end(req.msgGenerator.generateJSON('register', 'Необходим логотип при регистрации компании'));
        return;
    }

    Company.byLogin(req.body.login, (err, company) => {
        if (company) {
            req.logger.info('Компания с логином ' + req.body.login + ' уже существует');
            res.end(req.msgGenerator.generateJSON('error', 'Компания с таким логином уже существует'));
            return;
        }

        Company.create({
            login: req.body.login,
            password: req.body.password,
            email: req.body.email,
            name: req.body.name,
            INN: req.body.INN,
            OGRN: req.body.OGRN,
            active: false,
            logo: '/companies/' + req.file.filename
        }, (err, company) => {
            if (req.msgGenerator.generateError(err, req, res)) {
                return;
            }

            var activationHash = company.generateActivationHash();

            company.setActivationHash(activationHash);
            mail.sendActivationEmail(company.email, activationHash);

            req.logger.info('Создал новую компанию ' + company.login);
            res.end(req.msgGenerator.generateJSON('register', 'успешно'));
        });
    });

});

router.post('/authorize', (req, res) => {
    Company.authorize(req.body.login, req.body.password, (err, company) => {
        if (req.msgGenerator.generateError(err, req, res)) {
            return;
        }

        if (!company.active) {
            req.logger.info('Компания не активирована ' + req.body.login);
            res.end(req.msgGenerator.generateJSON('error', 'Е-мейл не активирован'));
            return;
        }

        var token = company.getToken();

        req.logger.info('Авторизовалась компания ' + req.body.login);
        res.end(req.msgGenerator.generateJSON('token', token));
    });
});

router.get('/activate', (req, res) => {
    var activationHash = req.query.hash;

    Company.tryActivateByHash(activationHash, (err, company) => {
        if (req.msgGenerator.generateError(err, req, res)) {
            return;
        }

        res.end('Компания успешно активирована!');
    });
});

router.use('/stocks/create', stockLogo.single('logo'));
router.use('/stocks/edit',   stockLogo.single('logo'));

router.use(mw.checkCompanyToken);
router.use('/stocks',    Stocks);
router.use('/companies', Companies);

module.exports = router;
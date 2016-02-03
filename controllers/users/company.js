var express     = require('express');
var mongoose    = require('mongoose');
var storages    = require('../../utils/storages.js');
var mw          = require('../../utils/middlewares.js');
var Stocks      = require('../models/stocks.js');
var Companies   = require('../models/companies.js');
var Categories  = require('../models/categories.js');
var Stats       = require('../mechanics/stats.js');
var JSONError   = require('../../lib/json_error');
var mail        = require('../../utils/mail.js');
var multer      = require('multer'); // миддлвеар для загрузки файлов
var companyLogo = multer({storage: storages.companyStorage});
var stockLogo   = multer({storage: storages.stockStorage});
var Company     = mongoose.model('Company');
var router      = express.Router();
var ObjectID    = require('mongodb').ObjectId;

router.post('/register', companyLogo.single('logo'), mw.checkLoginAndPassword, (req, res, next) => {
    if (!req.file) {
        req.logger.info('Нет логотипа при регистрации компании');
        return next(new JSONError('register', 'Необходим логотип при регистрации компании'));
    }

    var categoryID = null;
    try {
       categoryID = new ObjectID(req.body.category);
    } catch (e) {}

    Company.byLogin(req.body.login, (err, company) => {
        if (company) {
            req.logger.info('Компания с логином ' + req.body.login + ' уже существует');
            return next(new JSONError('error', 'Компания с таким логином уже существует'));
        }

        Company.create({
            login: req.body.login,
            category: categoryID,
            password: req.body.password,
            email: req.body.email,
            name: req.body.name,
            INN: req.body.INN,
            OGRN: req.body.OGRN,
            active: false,
            logo: '/companies/' + req.file.filename
        }, (err, company) => {
            if (err) {
                return next(err);
            }

            var activationHash = company.generateActivationHash();

            company.setActivationHash(activationHash);
            mail.sendActivationEmail(company.email, activationHash);

            req.logger.info('Создал новую компанию ' + company.login);
            res.JSONAnswer('register', 'успешно');
        });
    });

});

router.post('/authorize', (req, res, next) => {
    Company.authorize(req.body.login, req.body.password, (err, company) => {
        if (err) {
            return next(err);
        }


        if (!company.active) {
            req.logger.info('Компания не активирована ' + req.body.login);
            return next(new JSONError('error', 'Е-мейл не активирован'));
        }

        var token = company.getToken();

        req.logger.info('Авторизовалась компания ' + req.body.login);
        res.JSONAnswer('token', token);
    });
});

router.get('/activate', (req, res, next) => {
    var activationHash = req.query.hash;

    Company.tryActivateByHash(activationHash, (err, company) => {
        if (err) {
            return next(err);
        }

        res.redirect("http://fast-anchorage-39702.herokuapp.com/verify?token=" + company.getToken());
    });
});

router.use('/stocks/create', stockLogo.single('logo'));
router.use('/stocks/edit',   stockLogo.single('logo'));

router.use(mw.checkCompanyToken);
router.use('/stocks',     Stocks);
router.use('/companies',  Companies);
router.use('/categories', Categories);
router.use('/stats',      Stats);

module.exports = router;
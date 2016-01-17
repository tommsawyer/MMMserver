var express   = require('express');
var mongoose  = require('mongoose');
var mw        = require('../../utils/middlewares.js');
var ObjectID  = require('mongodb').ObjectID;
var JSONError = require('../../lib/json_error');
var Company   = mongoose.model('Company');
var router    = express.Router();

router.get('/all', mw.requireClientAuth, (req, res, next) => {
    Company.find({}, (err, companies) => {
        if (err) {
            next(err);
        }

        if (!companies){
            req.logger.warn('На сервере нет ни одной компании!');
        }

        var comp = companies.map((company) => {return company.toJSON()});

        req.logger.info('Отправляю все компании пользователю. Всего ' + comp.length);
        res.JSONAnswer('companies', comp);
    });
});

router.get('/me', mw.requireCompanyAuth, (req, res) => {
    req.logger.info('Присылаю информацию о компании ' + req.company._id);
    res.JSONAnswer('company', req.company.toJSON());
});

router.get('/info', mw.requireAnyAuth, (req, res, next) => {
    var companyID;

    try {
        companyID = new ObjectID(req.query.id);
    } catch (e) {
        return next(new JSONError('error', 'Некорректный айди компании - ' + req.query.id));
    }

    Company.findOne({_id: companyID}, (err, company) => {
        if (err) {
            throw err;
        }

        if (!company) {
            return next(new JSONError('error', 'Нет такой компании'));
        }

        req.JSONAnswer('company', company.toJSON());
    });

});

module.exports = router;
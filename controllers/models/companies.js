var express  = require('express');
var mongoose = require('mongoose');
var mw       = require('../../utils/middlewares.js');
var ObjectID = require('mongodb').ObjectID;
var router   = express.Router();

router.get('/all', mw.requireClientAuth, (req, res) => {
    var Company = mongoose.model('Company');

    Company.find({}, (err, companies) => {
        if (req.msgGenerator.generateError(err, req, res)) {return;}

        if (!companies){
            req.logger.warn('На сервере нет ни одной компании!');
        }

        var comp = companies.map((company) => {return company.toJSON()});

        req.logger.info('Отправляю все компании пользователю. Всего ' + comp.length);
        res.end(req.msgGenerator.generateJSON('companies', comp));
    });
});

router.get('/me', mw.requireCompanyAuth, (req, res) => {
    req.logger.info('Присылаю информацию о компании ' + req.company._id);
    res.end(req.msgGenerator.generateJSON('company', req.company.toJSON()));
});

router.get('/info', mw.requireAnyAuth, (req, res) => {
    var companyID = new ObjectID(req.query.id);
    var Company   = mongoose.model('Company');

    Company.findOne({_id: companyID}, (err, company) => {
        if (req.msgGenerator.generateError(err, req, res)) {return;}

        if (!company) {
            res.end(req.msgGenerator.generateJSON('error','Нет такой компании'));
            return;
        }

        res.end(req.msgGenerator.generateJSON('company', company.toJSON()));
    });

});

module.exports = router;
var express = require('express');
var router  = express.Router();
var mongoose = require('mongoose');
var mw       = require('../utils/middlewares.js');
var ObjectID = require('mongodb').ObjectID;

router.get('/all', (req, res) => {
    var Company = mongoose.model('Company');

    Company.find({}, (err, companies) => {
        if (err) {
            req.logger.error(err);
            throw (err);
        }

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

module.exports = router;

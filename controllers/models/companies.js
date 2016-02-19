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

router.get('/me', mw.requireCompanyAuth, (req, res, next) => {
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

router.post('/subscribe', mw.requireClientAuth, (req, res, next) => {
    try {
        var CompanyID = new ObjectID(req.body.id);
    } catch (e) {
        return next(new JSONError('error', 'Компании с таким айди не найдено', 404));
    }

    Company.findOne({_id: CompanyID}, (err, company) => {
        if (err) return next(err);

        if (!company) return next(new JSONError('error', 'Компании с таким айди не найдено', 404));

        req.user.subscribeToCompany(company._id, (err) => {
            if (err) return next(err);

            company.addSubscriber(req.user._id, (err) => {
                if (err) req.logger.error(err);
            });

            res.JSONAnswer('company', 'success');
        });
    });
});

router.post('/unsubscribe', mw.requireClientAuth, (req, res, next) => {
    try {
        var CompanyID = new ObjectID(req.body.id);
    } catch (e) {
        return next(new JSONError('error', 'Компании с таким айди не найдено', 404));
    }

    Company.findOne({_id: CompanyID}, (err, company) => {
        if (err) return next(err);

        if (!company) return next(new JSONError('error', 'Компании с таким айди не найдено', 404));

        req.user.unsubscribeFromCompany(company._id, (err) => {
            if (err) return next(err);

            company.removeSubscriber(req.user._id, (err) => {
                if (err) req.logger.error(err);
            });

            res.JSONAnswer('company', 'success');
        });
    });
});

router.get('/filter/search', mw.requireClientAuth, (req, res, next) => {
    req.logger.info('Ищу компании по запросу ' + req.query.searchword);
    var searchRegExp = new RegExp('.*' + req.query.searchword + '.*', 'i');

    Company.find({name: {$regex: searchRegExp}}, (err, companies) => {
        if (err) return next(err);

        res.JSONAnswer('companies', companies.map((comp) => comp.toJSON()));
    });
});

router.get('/subscriptions', mw.requireClientAuth, (req, res, next) => {
    Company.find({_id: {$in: req.user.filters.companies}}, (err, companies) => {
        if (err) return next(err);

        res.JSONAnswer('companies', companies.map((company) => {return company.toJSON()}));
    });
});

module.exports = router;
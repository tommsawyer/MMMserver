var express   = require('express');
var mongoose  = require('mongoose');
var mw        = require('../../utils/middlewares.js');
var ObjectID  = require('mongodb').ObjectID;
var filter    = require('../mechanics/filter.js');
var Stock     = mongoose.model('Stock');
var router    = express.Router();
var JSONError = require('../../lib/json_error');

router.use('/filter', filter);

router.post('/create', mw.requireCompanyAuth, (req, res, next) => {
    if (!req.file) {
        req.logger.warn('Запрос создания акции без логотипа');
    }

    var stock = new Stock({
        name: req.body.name,
        description: req.body.description,
        company: req.company._id,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate)
    });

    stock.addLogo(req.file);

    stock.save((err, stock) => {
        if (err) {
            return next(err);
        }

        res.JSONAnswer('stock', {id: stock._id, logo: stock.logo});
    });
});

router.post('/edit', mw.requireCompanyAuth, (req, res, next) => {
    Stock.findOne({'_id' : new ObjectID(req.body.id)}, (err, stock) => {
        if (err) {
            return next(err);
        }

        if (!stock) {
            req.logger.warn('Нет акции с айди ' + req.body.id);
            return next(new JSONError('error', 'Нет такой акции'));
        }

        if (!stock.checkOwner(req.company._id)) {
            req.logger.warn('Компания с айди ' + req.company._id + ' не может редактировать акцию ' + req.body.id);
            return next(new JSONError('error', 'Вы не можете редактировать эту акцию'));
        }

        if (!req.file) {
            req.logger.warn('Запрос редактирования акции без логотипа');

            stock.name = req.body.name;
            stock.description = req.body.description;
            stock.endDate = new Date(req.body.endDate);

            stock.save((err) => {
                if (err) {
                    return next(err);
                }

                res.JSONAnswer('stock', stock.logo);
            });
        } else {
            stock.removeImages((err) => {
                if (err) {
                    return next(err);
                }

                stock.addLogo(req.file);

                stock.name = req.body.name;
                stock.description = req.body.description;
                stock.startDate = new Date(req.body.startDate);
                stock.endDate = new Date(req.body.endDate);

                stock.save((err) => {
                    if (err) {
                        return next(err);
                    }
                    res.JSONAnswer('stock', stock.logo);
                });
            });
        }
    });
});

router.post('/remove', mw.requireCompanyAuth, (req, res, next) => {
    Stock.findOne({_id: req.body.id}, (err, stock) => {
        if (err) {
            return next(err);
        }
        if (!stock) {
            return next(new JSONError('error', 'Нет такой акции'));
        }

        if (!stock.checkOwner(req.company._id.toString())) {
            return next(new JSONError('error', 'Эта компания не имеет прав для удаления этой акции'));
        }

        stock.prepareRemove((err) => {
            if (err) {
                return next(err);
            }

            stock.remove();
            req.logger.info('Акция с айди ' + stock._id + ' удалена');
            res.JSONAnswer('stock', stock._id);
        });
    });
});

router.post('/subscribe', mw.requireClientAuth, (req, res, next) => {
    req.user.subscribe(req.body.id, (err, stock) => {
        if (err) {
            return next(err);
        }

        req.user.save((err, user) => {
            if (err) {
                return next(err);
            }

            req.logger.info('Юзер ' + user.login + ' подписался на акцию ' + stock._id);
            res.JSONAnswer('subscribeStock', 'OK');
        });
    });
});

router.post('/unsubscribe', mw.requireClientAuth, (req, res, next) => {
    Stock.findOne({'_id':new ObjectID(req.body.id)}, (err, stock) => {
        if (err) {
            return next(err);
        }
        stock.removeSubscriber(req.user._id.toString(), (err) => {
            if (err) {
                return next(err);
            }

            req.user.unsubscribe(stock._id);
            res.JSONAnswer('unsubscribestock', 'success');
        });
    });
});

router.get('/info', mw.requireAnyAuth, (req, res, next) => {
    try {
        var stockID = new ObjectID(req.query.id);
    } catch (e) {
        return next(new JSONError('stockinfo', 'Нет такой акции', 404));
    }


    Stock.findOne({_id: stockID}, (err, stock) => {
        if (err) return next(err);

        if (!stock) return next(new JSONError('stockinfo', 'Нет такой акции', 404));

        stock.toJSON(req.user ? req.user._id : undefined).then((stockJSON) => {
            res.JSONAnswer('stockinfo', stockJSON);
        });
    });
});

router.get('/feed', mw.requireClientAuth, (req, res, next) => {
    req.user.getSubscribitions((err, stocks) => {
        if (err) {
            return next(err);
        }

        res.JSONAnswer('userstocks', stocks);
    });
});

router.get('/all', mw.requireClientAuth, (req, res) => {
    Stock.allToJSON(req.user._id.toString(), function (stocks) {
        res.JSONAnswer('stock', stocks);
    });
});

router.get('/me', mw.requireCompanyAuth, (req, res, next) => {
    Stock.byCompanyID(req.company._id, undefined,  (err, stocks) => {
        if (err) {
            return next(err);
        }

        req.logger.info('Отправляю клиенту акции компании ' + req.company.login);
        res.JSONAnswer('stocks', stocks);
    });
});

module.exports = router;

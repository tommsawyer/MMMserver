var express = require('express');
var mw = require('../../utils/middlewares.js');
var mongoose = require('mongoose');
var router = express.Router();
var Company = mongoose.model('Company');
var Stock = mongoose.model('Stock');
var JSONError = require('../../lib/json_error');
var ObjectID = require('mongodb').ObjectId;

router.get('/stocksperdate', mw.requireCompanyAuth, (req, res, next) => {
    Stock.byCompanyID(req.company._id, (err, stocks) => {
        if (err) {
            return next(err);
        }

        if (stocks.length == 0) {
            return res.JSONAnswer('stocksperdate', {});
        }

        var dates = {};

        Stock.arrayToJSON(stocks).forEach((stock) => {
            stock.subscribes.forEach((subscr) => {
                var date = subscr.date.toDateString();
                dates[date] = dates[date] + 1 || 1;
            });
        });

        res.JSONAnswer('stocksperdate', dates);
    });
});

router.get('/usersperstock', mw.requireCompanyAuth, (req, res, next) => {
    try {
        var id = new ObjectID(req.query.id);
    } catch (e) {
        return next(new JSONError('usersperstock', 'Такой акции не найдено', 404));
    }

    Stock.findOne({_id: id}, (err, stock) => {
        if (err) return next(err);
        if (!stock) return next(new JSONError('usersperstock', 'Такой акции не найдено', 404));

        var dates = {};

        stock.subscribes.forEach((subscr) => {
            var date = subscr.date.toDateString();
            dates[date] = dates[date] + 1 || 1;
        });

        res.JSONAnswer('usersperstock', dates);
    });
});

router.get('/countperstock', mw.requireCompanyAuth, (req, res, next) => {
    Stock.byCompanyID(req.company._id, (err, stocks) => {
        if (err) return next(err);

        if (stocks.length == 0) {
            return res.JSONAnswer('countperstock', {});
        }

        var data = {};

        Stock.arrayToJSON(stocks).forEach((stock) => {
           data[stock.name] = stock.subscribes.length;
        });

        res.JSONAnswer('countperstock', data);
    });
});

router.get('/stockinfo',     mw.requireCompanyAuth, (req, res, next) => {
    try {
        var stockID = new ObjectID(req.query.id);
    } catch (e) {
        return next(new JSONError('error', 'Акции с таким айди не найдено', 404));
    }

    Stock.findOne({_id: stockID}, (err, stock) => {
        if (err) return next(err);

        if (!stock)
            return next(new JSONError('error', 'Акции с таким айди не найдено', 404));

        var stockInfo = {
            viewsInFeed: stock.viewsInFeed,
            views: stock.views,
            subscribes: stock.getSubscribesCount(),
            uses: stock.getNumberOfUses()
        };

        res.JSONAnswer('stockinfo', stockInfo);
    });
});

module.exports = router;
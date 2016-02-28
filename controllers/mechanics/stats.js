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

        var stats = {};
        stats[stock.name] = stock.getSubscriptionDates().map((date) => {
            return date.toDateString();
        });

        res.JSONAnswer('usersperstock', stats);
    });
});

router.get('/countperstock', mw.requireCompanyAuth, (req, res, next) => {
    Stock.byCompanyID(req.company._id, (err, stocks) => {
        if (err) return next(err);

        if (stocks.length == 0) {
            return res.JSONAnswer('countperstock', {});
        }

        var data = {};

        stocks.forEach((stock) => {
            data[stock.name] = stock.getSubscriptionDates().map((date) => {
                return date.toDateString();
            });
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
            viewsInFeed: stock.viewsInFeed || 0,
            views: stock.views || 0,
            subscribes: stock.getSubscribesCount(),
            uses: stock.getNumberOfUses(),
            reuses: stock.getNumberOfReUses()
        };

        res.JSONAnswer('stockinfo', stockInfo);
    });
});

router.get('/numberofuses',  mw.requireCompanyAuth, (req, res, next) => {
   Stock.byCompanyID(req.company._id, (err, stocks) => {
       if (err) return next(err);

       if (stocks.length == 0) {
           return res.JSONAnswer('numberofuses', {});
       }

       var stats = {};

       stocks.forEach((stock) => {
           stats[stock.name] = [];
           stock.subscribes.forEach((subscribe) => {
               stats[stock.name] = stats[stock.name].concat(subscribe.numberOfUses.map(date => date.toDateString()));
           });
       });

       res.JSONAnswer('numberofuses', stats);
   });
});

module.exports = router;
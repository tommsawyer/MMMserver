var express = require('express');
var mw = require('../../utils/middlewares.js');
var mongoose = require('mongoose');
var router = express.Router();
var Company = mongoose.model('Company');
var Stock = mongoose.model('Stock');

router.get('/stocksperdate', mw.requireCompanyAuth, (req, res, next) => {
    Stock.byCompanyID(req.company._id, null, (err, stocks) => {
        console.log(stocks);
        if (err) {
            return next(err);
        }

        if (stocks.length == 0) {
            return res.JSONAnswer('stocksperdate', {});
        }

        var dates = {};

        stocks.forEach((stock) => {
            stock.subscribes.forEach((subscr) => {
                dates[subscr.date] = dates[subscr.date] + 1 || 1;
            });
        });

        res.JSONAnswer('stocksperdate', dates);
    });
});

module.exports = router;
var express  = require('express');
var mw       = require('../../utils/middlewares.js');
var mongoose = require('mongoose');
var ObjectID = require('mongodb').ObjectID;
var Stock    = mongoose.model('Stock');
var Client   = mongoose.model('Client');
var router   = express.Router();

router.get('/', mw.requireClientAuth, (req, res) => {
    var query = {
        companyID : req.query.companyID,
        searchword: req.query.searchword,
        category  : req.category
    };

    Stock.byQuery(query, req.user._id.toString(), (err, stocks) => {
        if (err) {
            return next(err);
        }

        req.logger.info('Отправляю клиенту найденные акции');
        res.JSONAnswer('stocks', stocks);
    });

});

router.get('/company', mw.requireClientAuth, (req, res) => {
    Stock.byCompanyID(req.query.companyID, req.user._id.toString(), (err, stocks) => {
        if (err) {
            return next(err);
        }

        req.logger.info('У компании ' + req.query.companyID + ' ' + stocks.length + ' акций. Отправляю клиенту');
        res.JSONAnswer('stocks', stocks);
    });
});

router.get('/search', mw.requireClientAuth, (req, res) => {
    var searchWord = req.query.searchword;

    Stock.bySearchWord(searchWord, req.user._id.toString(), (err, stocks) => {
        if (err) {
            return next(err);
        }

        req.logger.info('Поиск по запросу ' + searchWord + ' нашел ' + stocks.length + ' акций');
        res.JSONAnswer('stocks', stocks);
    });
});

router.get('/friends', mw.requireClientAuth, (req, res, next) => {
    var friendsID = req.user.friends.map((id) => {return new ObjectID(id)});

    Client.find({_id: {$in: friendsID}}, (err, friends) => {
        if (err) {
            return next(err);
        }

        var stocksID = [];

        friends.forEach((friend) => {
            friend.stocks.forEach((stock) => {
                if (stocksID.indexOf(stock) == -1) {
                    stocksID.push(stock);
                }
            });
        });

        if (stocksID.length == 0) {
            return res.JSONAnswer('friendsfeed', []);
        } else {
            stocksID = stocksID.map((stock) => {return new ObjectID(stock)});
        }

        Stock.find({_id: {$in: stocksID}}, (err, stocks) => {
            if (err) {
                return next(err);
            }

            if (stocks.length == []) {
                return res.JSONAnswer('friendsfeed', []);
            }

            Stock.arrayToJSON(req.client._id, stocks, (stocksJSON) => {
                res.JSONAnswer('friendsfeed', stocksJSON);
            });
        });
    });
});

module.exports = router;

var express   = require('express');
var mw        = require('../../utils/middlewares.js');
var mongoose  = require('mongoose');
var JSONError = require('../../lib/json_error');
var ObjectID  = require('mongodb').ObjectID;
var Stock     = mongoose.model('Stock');
var Client    = mongoose.model('Client');
var Category  = mongoose.model('Category');
var router    = express.Router();

router.get('/', mw.requireClientAuth, (req, res, next) => {
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

router.get('/company', mw.requireClientAuth, (req, res, next) => {
    Stock.byCompanyID(req.query.companyID, req.user._id.toString(), (err, stocks) => {
        if (err) {
            return next(err);
        }

        req.logger.info('У компании ' + req.query.companyID + ' ' + stocks.length + ' акций. Отправляю клиенту');
        res.JSONAnswer('stocks', stocks);
    });
});

router.get('/category', mw.requireClientAuth, (req, res, next) => {
    try {
        var CategoryID = new ObjectID(req.query.id);
    } catch (e) {
        return next(new JSONError('error', 'Нет такой категории', 404));
    }

    Category.findOne({_id: CategoryID}, (err, category) => {
        if (err) return next(err);

        if (!category) return next(new JSONError('error', 'Нет такой категории', 404));

        Stock.find({category: CategoryID}, (err, stocks) => {
            if (err) return next(err);

            if (stocks.length == 0) return res.JSONAnswer('stocks', []);

            Stock.arrayToJSON(req.user._id.toString(), stocks, (stocksJSON) => {
                res.JSONAnswer('stocks', stocksJSON);
            });
        });
    });

});

router.get('/search', mw.requireClientAuth, (req, res, next) => {
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

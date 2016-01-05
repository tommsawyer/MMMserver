var express  = require('express');
var mw       = require('../../utils/middlewares.js');
var mongoose = require('mongoose');
var Stock    = mongoose.model('Stock');
var router   = express.Router();

router.get('/', mw.requireClientAuth, (req, res) => {
    var query = {
        companyID : req.query.companyID,
        searchword: req.query.searchword,
        category  : req.category
    };

    Stock.byQuery(query, req.user._id.toString(), (err, stocks) => {
        if (err) {
            throw err;
        }

        req.logger.info('Отправляю клиенту найденные акции');
        res.JSONAnswer('stocks', stocks);
    });

});

router.get('/company', mw.requireClientAuth, (req, res) => {
    Stock.byCompanyID(req.query.companyID, req.user._id.toString(), (err, stocks) => {
        if (err) {
            throw err;
        }

        req.logger.info('У компании ' + req.query.companyID + ' ' + stocks.length + ' акций. Отправляю клиенту');
        res.JSONAnswer('stocks', stocks);
    });
});

router.get('/search', mw.requireClientAuth, (req, res) => {
    var searchWord = req.query.searchword;

    Stock.bySearchWord(searchWord, req.user._id.toString(), (err, stocks) => {
        if (err) {
            throw err;
        }

        req.logger.info('Поиск по запросу ' + searchWord + ' нашел ' + stocks.length + ' акций');
        res.JSONAnswer('stocks', stocks);
    });
});

module.exports = router;

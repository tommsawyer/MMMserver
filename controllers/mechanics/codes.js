var JSONError = require('../../lib/json_error');
var express   = require('express');
var mw        = require('../../utils/middlewares');
var mongoose  = require('mongoose');
var Stock     = mongoose.model('Stock');
var router    = express.Router();

router.get('/check', mw.requireCompanyAuth, (req, res, next) => {
    var code = req.query.code;

    Stock.bySubscriptionCode(code, (err, stock) => {
        if (err) return next(err);

        stock.getUserByCode(code, (err, clientJSON) => {
            if (err) return next(err);

            stock.toJSON().then((stockJSON) => {
                res.JSONAnswer('check', {
                    user: clientJSON,
                    stock: stockJSON
                });
            });
        });
    });
});

router.post('/apply', mw.requireCompanyAuth, (req, res, next) => {
    var code = req.body.code;
    Stock.bySubscriptionCode(code, (err, stock) => {
        if (err) return next(err);

        if (stock.incrementNumberOfUses(code)) {
            res.JSONAnswer('apply', 'success');
        } else {
            return next(new JSONError('error', 'Не удалось активировать акцию'));
        }
    });
});

module.exports = router;



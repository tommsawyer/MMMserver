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

        if (!stock.checkOwner(req.company._id))
            return next(new JSONError('error', 'Вы не имеете права просматривать информацию об этой подписке', 403));

        stock.getUserByCode(code, (err, clientJSON) => {
            if (err) return next(err);

            res.JSONAnswer('check', {
                user: clientJSON,
                stock: stock.toJSON()
            });
        });
    });
});

router.post('/apply', mw.requireCompanyAuth, (req, res, next) => {
    var code = req.body.code;
    Stock.bySubscriptionCode(code, (err, stock) => {
        if (err) return next(err);

        if (!stock.checkOwner(req.company._id))
            return next(new JSONError('error', 'Вы не имеете права активировать эту подписку', 403));

        if (stock.incrementNumberOfUses(code)) {
            res.JSONAnswer('apply', 'success');
        } else {
            return next(new JSONError('error', 'Не удалось активировать акцию'));
        }
    });
});

module.exports = router;



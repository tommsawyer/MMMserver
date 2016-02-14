var express   = require('express');
var mongoose  = require('mongoose');
var mw        = require('../../utils/middlewares.js');
var ObjectID  = require('mongodb').ObjectID;
var JSONError = require('../../lib/json_error');
var Category  = mongoose.model('Category');
var router    = express.Router();

router.get('/all', (req, res, next) => {
    Category.toJSON((err, categories) => {
        if (err) {
            return next(err);
        }

        res.JSONAnswer('categories', categories);
    });
});

router.post('/subscribe', mw.requireClientAuth, (req, res, next) => {
    try {
        var CategoryID = new ObjectID(req.body.id);
    } catch (e) {
        return next(new JSONError('error', 'Категории с таким айди не найдено', 404));
    }

    Category.findOne({_id: CategoryID}, (err, category) => {
        if (err) return next(err);

        if (!category) return next(new JSONError('error', 'Категории с таким айди не найдено', 404));

        req.user.subscribeToCategory(category._id, (err) => {
            if (err) return next(err);

            res.JSONAnswer('category', 'success');
        });
    });
});

router.post('/unsubscribe', mw.requireClientAuth, (req, res, next) => {
    try {
        var CategoryID = new ObjectID(req.body.id);
    } catch (e) {
        return next(new JSONError('error', 'Категории с таким айди не найдено', 404));
    }

    Category.findOne({_id: CategoryID}, (err, category) => {
        if (err) return next(err);

        if (!category) return next(new JSONError('error', 'Категории с таким айди не найдено', 404));

        req.user.unsubscribeFromCategory(category._id, (err) => {
            if (err) return next(err);

            res.JSONAnswer('category', 'success');
        });
    });
});

router.get('/filter/search', mw.requireClientAuth, (req, res, next) => {
    req.logger.info('Ищу категории по запросу ' + req.query.searchword);
    var searchRegExp = new RegExp('.*' + req.query.searchword + '.*', 'i');

    Category.find({name: {$regex: searchRegExp}}, (err, categories) => {
        if (err) return next(err);

        res.JSONAnswer('categories', categories.map((category) => category.toJSON()));
    });
});

module.exports = router;
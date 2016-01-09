var express   = require('express');
var mongoose  = require('mongoose');
var mw        = require('../../utils/middlewares.js');
var ObjectID  = require('mongodb').ObjectID;
var JSONError = require('../../lib/json_error');
var Category   = mongoose.model('Category');
var router    = express.Router();

router.get('/all', (req, res, next) => {
    Category.toJSON((err, categories) => {
        if (err) {
            return next(err);
        }

        res.JSONAnswer('categories', categories);
    });
});

module.exports = router;
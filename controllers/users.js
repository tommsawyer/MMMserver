var express = require('express');
var router  = express.Router();
var mongoose = require('mongoose');
var mw       = require('../utils/middlewares.js');
var ObjectID = require('mongodb').ObjectID;

router.use(mw.requireClientAuth);

router.post('/addstock', (req, res) => {
    var Stock = mongoose.model('Stock');

    Stock.findOne({_id: new ObjectID(req.body.id)}, (err, stock) => {
        if (err) throw err;
        if (!stock){
            req.logger.warn('Не существует акции с айди ' + req.body._id);
            res.end(req.msgGenerator.generateJSON('error', 'Нет такой акции'));
            return;
        }

        req.user.stocks += stock._id;
        req.user.save((err, user) => {
            if (err) {
                req.logger.error(err);
                throw err;
            }

            res.end(req.msgGenerator.generateJSON('subscribeStock', 'OK'));
            req.logger.info('Юзер ' + user.login + ' подписался на акцию ' + stock._id);
        });
    });
});

module.exports = router;

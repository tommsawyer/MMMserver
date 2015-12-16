var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var mw = require('../utils/middlewares.js');

router.use(mw.requireClientAuth);

router.get('/feed', mw.requireClientAuth, (req, res) => {
    req.user.getSubscribitions((err, stocks) => {
        if (req.msgGenerator.generateError(err, req, res)) {
            return;
        }

        res.end(req.msgGenerator.generateJSON('userstocks', stocks));
    });
});

router.post('/addstock', (req, res) => {
    req.user.subscribe(req.body.id, (err, stock) => {
        if (req.msgGenerator.generateError(err, req, res)) {
            return;
        }

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

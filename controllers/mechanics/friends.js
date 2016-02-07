var express = require('express');
var mw = require('../../utils/middlewares.js');
var mongoose = require('mongoose');
var ObjectID = require('mongodb').ObjectID;
var Client = mongoose.model('Client');
var Stock = mongoose.model('Stock');
var router = express.Router();

router.post('/add', mw.requireClientAuth, (req, res, next) => {
    req.user.addFriend(req.body.id, (err) => {
        if (err) {
            return next(err);
        }

        res.JSONAnswer('addfriend', 'success');
    });
});

router.post('/delete', mw.requireClientAuth, (req, res, next) => {
    req.user.removeFriend(req.body.id, (err) => {
        if (err) {
            return next(err);
        }

        res.JSONAnswer('deletefriend', 'success');
    });
});

router.get('/all', mw.requireClientAuth, (req, res, next) => {
    var friendsID = req.user.friends.map((id) => new ObjectID(id));

    Client.find({_id: {$in: friendsID}}, (err, friends) => {
        if (err) {
            return next(err);
        }

        var friendsJSON = friends.map((friend) => {return friend.toJSON()});
        res.JSONAnswer('allfriends', friendsJSON);
    });
});

router.get('/filter', mw.requireClientAuth, (req, res, next) => {
    Client.byFilter(req.query.FIO, req.query.mail, req.query.phone, (err, users) => {
        if (err) return next(err);

        for (var i = 0; i < users.length; i++) {
            var userInfo = users[i];

            userInfo['isFriend'] = req.user.isInFriends(userInfo['id']);
        }

        res.JSONAnswer('friendsfilter', users);
    });
});

module.exports = router;

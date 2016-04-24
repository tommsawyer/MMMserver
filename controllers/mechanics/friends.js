var express         = require('express'),
    StringResources = require('../../utils/string_resources'),
    mw              = require('../../utils/middlewares.js'),
    mongoose        = require('mongoose'),
    ObjectID        = require('mongodb').ObjectID,

    Client          = mongoose.model('Client'),
    Stock           = mongoose.model('Stock'),
    router          = express.Router();

router.post('/add', mw.requireClientAuth, (req, res, next) => {
    req.user.friendsController.addFriendByID(req.body.id)
        .then(() => {
            res.JSONAnswer(StringResources.answers.ADD_FRIEND, StringResources.answers.OK);
        })
        .catch(next);
});

router.post('/delete', mw.requireClientAuth, (req, res, next) => {
    req.user.friendsController.removeFriendByID(req.body.id)
        .then(() => {
            res.JSONAnswer(StringResources.answers.DELETE_FRIEND, StringResources.answers.OK);
        })
        .catch(next);
});

router.get('/all', mw.requireClientAuth, (req, res, next) => {
    req.user.friendsController.getAllFriends()
        .then((friends) => {
            var friendsJSON = friends.map(client => client.toJSON());

            res.JSONAnswer(StringResources.answers.ALL_FRIENDS, friendsJSON);
        })
        .catch(next);
});

router.get('/filter', mw.requireClientAuth, (req, res, next) => {
    Client.byFilter(req.user._id, req.query.FIO, req.query.mail, req.query.phone, (err, users) => {
        if (err) return next(err);

        for (var i = 0; i < users.length; i++) {
            var userInfo = users[i];

            userInfo['isFriend'] = req.user.isInFriends(userInfo['id']);
        }

        res.JSONAnswer('friendsfilter', users);
    });
});

module.exports = router;

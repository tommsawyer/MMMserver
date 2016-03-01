module.exports = function(logger) {
    var mongoose  = require('mongoose');
    var Schema    = mongoose.Schema;
    var ObjectID  = require('mongodb').ObjectID;
    var JSONError = require('../lib/json_error');


    var ArchivedSubscriptionSchema = new Schema({
        archivedDate:     Date,
        subscriptionDate: Date,
        code:             String,
        userID:           Schema.Types.ObjectId,
        companyID:        Schema.Types.ObjectId,
        stockID:          Schema.Types.ObjectId,
        numberOfUses:     [Date]
    });

    ArchivedSubscriptionSchema.statics.archive = function(companyID, stockID, subscription) {
        logger.info('Архивирую подписку на акцию ' + stockID + ' пользователя ' + subscription.id);
        this.create({
            archivedDate:     new Date(),
            subscriptionDate: subscription.date,
            userID:           subscription.id,
            companyID:        companyID,
            stockID:          stockID,
            numberOfUses:     subscription.numberOfUses,
            code:             subscription.code
        }, (err) => {
            if (err) logger.error(err);
        });
    };

    ArchivedSubscriptionSchema.statics.lookPreviousSubscriptions = function(userID, stockID, callback) {
        logger.info('Ищу предыдущие подписки');
        this.find({userID: userID, stockID: stockID}, (err, archievedSubscriptions) => {
            if (err) return callback(err);
            callback(null, archievedSubscriptions);
        });
    };

    ArchivedSubscriptionSchema.statics.newest = function(subscriptions) {
        return subscriptions.sort(function(a, b) {
           return b.archivedDate - a.archivedDate
        })[0];
    };

    mongoose.model('ArchivedSubscription', ArchivedSubscriptionSchema);
    logger.info('Подключил модель архивированной подписки');
};
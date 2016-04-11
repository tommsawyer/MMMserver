module.exports = function(logger) {
    var mongoose  = require('mongoose'),
        Schema    = mongoose.Schema,
        ObjectID  = require('mongodb').ObjectID,
        JSONError = require('../lib/json_error');

    var ArchivedSubscriptionSchema = new Schema({
        archivedDate:     Date,                  // дата архивирования этой подписки
        subscriptionDate: Date,                  // дата подписки пользователем на эту акцию
        code:             String,                // активационный код для этого пользователя
        userID:           Schema.Types.ObjectId, // айди пользователя
        companyID:        Schema.Types.ObjectId, // айди компании
        stockID:          Schema.Types.ObjectId, // айди акции
        activationDates:  [Date]                 // массив с датами использования акции
    });

    ArchivedSubscriptionSchema.statics.archive = function(companyID, stockID, subscription) {
        var self = this;
        logger.info('Архивирую подписку на акцию ' + stockID + ' пользователя ' + subscription.id);

        return new Promise(function(resolve, reject) {
            self.create({
                archivedDate:     new Date(),
                subscriptionDate: subscription.date,
                userID:           subscription.id,
                companyID:        companyID,
                stockID:          stockID,
                activationDates:  subscription.numberOfUses,
                code:             subscription.code
            }, (err, archivedSubcription) => {

                if (err) {
                    logger.error(err);
                    return reject(err);
                };

                resolve(archivedSubcription);
            });
        });
    };

    ArchivedSubscriptionSchema.statics.lookForPreviousSubscriptions = function(userID, stockID) {
        var self        = this,
            searchQuery = {
                userID: userID,
                stockID: stockID
            };

        logger.info('Ищу предыдущие подписки');

        return new Promise(function(resolve ,reject) {
            self.find(searchQuery, (err, archievedSubscriptions) => {
                if (err) return reject(err);
                resolve(archievedSubscriptions);
            });
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
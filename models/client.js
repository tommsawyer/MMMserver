module.exports = function (logger) {
    var mongoose  = require('mongoose');
    var Schema    = mongoose.Schema;
    var ObjectID  = require('mongodb').ObjectID;
    var JSONError = require('../lib/json_error');
    var User      = mongoose.model('User');

    var ClientSchema = new Schema({
        address: String,
        filters: [{id: String, name: String}],
        FIO: String,
        friends: [{id: String}],
        mail: String,
        phone: String,
        stocks: [String]
    });


    ClientSchema.methods.getSubscribitions = function (callback) {
        var Stock = mongoose.model('Stock');
        var subscribitions = this.stocks.map((id) => {
            return new ObjectID(id)
        });
        var self = this;


        if (subscribitions.length == 0) {
            callback(null, []);
            return;
        }

        Stock.find({_id: {$in: subscribitions}}, (err, stocks) => {
            if (err) {
                callback(err);
                return;
            }

            Stock.arrayToJSON(self._id, stocks, (stocksJSON) => {
                callback(null, stocks);
            });
        });
    };

    ClientSchema.methods.subscribe = function (id, callback) {
        var Stock = mongoose.model('Stock');

        Stock.findOne({_id: new ObjectID(id)}, (err, stock) => {
            if (err) {
                callback(err);
            }

            if (!stock) {
                logger.warn('Не существует акции с айди ' + id);
                callback(new JSONError('error', 'Нет такой акции'));
                return;
            }

            logger.info('Нашел акцию с айди ' + stock._id.toString());

            var id = stock._id.toString();
            var subscribes = this.stocks;

            if (subscribes.indexOf(id) != -1) {
                logger.warn('Попытка подписаться на акцию, которая уже в подписках. Айди ' + id);
                callback(new JSONError('error', 'Вы уже подписаны на эту акцию'));
                return;
            }

            subscribes.push(id);
            this.stocks = subscribes;
            stock.addSubscriber(this._id.toString());
            callback(null, stock);
        });
    };

    ClientSchema.methods.unsubscribe = function (id) {
        var stockPosition = this.stocks.indexOf(id);

        if (stockPosition == -1) {
            return false;
        }

        this.stocks.splice(stockPosition, 1);
        logger.info('Пользователь ' + this.login + ' отписался от акции ' + id);
        this.save();
    };

    User.discriminator('Client', ClientSchema);
    logger.info('Подключил модель Client');
};
module.exports = function (logger) {
    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;
    var ObjectID = require('mongodb').ObjectID;
    var User = mongoose.model('User');

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
        var subscribitions = this.stocks.map((id) => {return new ObjectID(id)});


        if (subscribitions.length == 0) {
            callback(null, []);
            return;
        }

        Stock.find({_id: {$in: subscribitions}}, (err, stocks) => {
            if (err) {
                callback(err);
                return;
            }

            var promises = [];

            stocks.forEach((stock) => {
                promises.push(stock.toJSON())
            });

            Promise.all(promises).then(function (stocks) {
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
                req.logger.warn('Не существует акции с айди ' + req.body._id);
                callback(new Error('Нет такой акции'));
                return;
            }

            var id = stock._id.toString();
            var subscribes = this.stocks;

            if (subscribes.indexOf(id) != -1) {
                req.logger.warn('Попытка подписаться на акцию, которая уже в подписках. Айди ' + req.body._id);
                callback(new Error('Вы уже подписаны на эту акцию'));
                return;
            }

            subscribes.push(id);
            this.stocks = subscribes;
            stock.addSubscriber(this._id.toString());
            callback(null, stock);
        });
    };

    ClientSchema.methods.unsubscribe = function(id) {
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
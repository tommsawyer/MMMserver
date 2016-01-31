module.exports = function (logger) {
    var mongoose  = require('mongoose');
    var Schema    = mongoose.Schema;
    var ObjectID  = require('mongodb').ObjectID;
    var JSONError = require('../lib/json_error');
    var User      = mongoose.model('User');

    var ClientSchema = new Schema({
        address: String,
        filters: {
            companies: [Schema.Types.ObjectId],
            categories: [Schema.Types.ObjectId]
        },
        FIO: String,
        friends: [String],
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
                callback(null, stocksJSON);
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

    ClientSchema.methods.subscribeToCompany = function (id, callback) {
        if (this.filters.companies.indexOf(id) != -1) {
            return callback(new JSONError('error', 'Вы уже подписаны на эту компанию'));
        }

        this.filters.companies.push(id);
        logger.info('Пользователь ' + this.login + ' подписался на компанию с айди ' + id.toString());
        callback(null);
        this.save();
    };

    ClientSchema.methods.unsubscribeFromCompany = function (id, callback) {
        var companyPosition = this.filters.companies.indexOf(id);

        if (companyPosition == -1) {
            return callback(new JSONError('error', 'Вы не подписаны на эту компанию'));
        }

        this.filters.companies.splice(companyPosition, 1);
        logger.info('Пользователь ' + this.login + ' отписался от компании с айди ' + id.toString());
        callback(null);
        this.save();
    };

    ClientSchema.methods.subscribeToCategory = function (id, callback) {
        if (this.filters.categories.indexOf(id) != -1) {
            return callback(new JSONError('error', 'Вы уже подписаны на эту категорию'));
        }

        this.filters.categories.push(id);
        logger.info('Пользователь ' + this.login + ' подписался на категорию с айди ' + id.toString());
        callback(null);
        this.save();
    };

    ClientSchema.methods.unsubscribeFromCategory = function (id, callback) {
        var categoryPosition = this.filters.categories.indexOf(id);

        if (categoryPosition == -1) {
            return callback(new JSONError('error', 'Вы не подписаны на эту категорию'));
        }

        this.filters.categories.splice(categoryPosition, 1);
        logger.info('Пользователь ' + this.login + ' отписался от категории с айди ' + id.toString());
        callback(null);
        this.save();
    };

    ClientSchema.methods.addFriend = function(id, callback) {
        if (this.friends.indexOf(id) == -1) {
            this.friends.push(id);
            this.save();
            callback(null);
        } else {
            callback(new JSONError('error', 'Этот пользователь уже в друзьях'));
        }
    };

    ClientSchema.methods.removeFriend = function(id, callback) {
        var idPosition = this.friends.indexOf(id);
        if (idPosition == -1) {
            callback(new JSONError('error', 'Этого пользователя нет в друзьях'));
        } else {
            this.friends.slice(idPosition, 1);
            this.save();
            callback(null);
        }
    };

    ClientSchema.methods.toJSON = function (){
      return {
          'FIO': this.FIO,
          'mail': this.mail,
          'phone': this.phone,
          'friends': this.friends,
          'login': this.login
      }
    };

    ClientSchema.statics.byFilter = function(FIO, mail, phone, callback) {
        var fields = {
            'FIO': FIO,
            'mail': mail,
            'phone': phone
        };

        var query = {
            $or: []
        };

        for (var name in fields) {
            if (fields[name]) {
              var obj = {};
              obj[name] = new RegExp('.*' + fields[name] + '.*', 'i');
              query.$or.push(obj);
            }
        }

        if (Object.keys(query.$or).length == 0) return callback(new JSONError('filter', 'Не заполнены поля', 400));

        logger.inspect('Поисковые параметры: ', query);

        this.find(query, (err, clients) => {
            if (err) return callback(err);

            if (clients.length == 0) return callback(null, []);

            callback(null, clients.map((client) => {
                return client.toJSON();
            }));
        });
    };

    User.discriminator('Client', ClientSchema);
    logger.info('Подключил модель Client');
};
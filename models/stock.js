module.exports = function (logger) {
    var mongoose = require('mongoose');
    var fs = require('fs');
    var ObjectID = require('mongodb').ObjectID;
    var gm = require('gm').subClass({imageMagick: true});
    var Schema = mongoose.Schema;

    const THUMBNAIL_WIDTH = 480;

    var StockSchema = new Schema({
        name: String,
        description: String,
        company: String,
        logo: String,
        thumb: String,
        subscribes: [String],
        startDate: Date,
        endDate: Date
    });

    StockSchema.methods.addSubscriber = function (id) {
        logger.info('Добавляю подписчика к акции ' + this._id);
        this.subscribes.push(id);
        this.save();
    };

    StockSchema.methods.removeSubscriber = function (userID, callback) {
        var pos = this.subscribes.indexOf(userID);

        if (pos == -1) {
            callback(new Error('Юзер не подписан на эту акцию'));
            return;
        }

        this.subscribes.splice(pos, 1);
        callback(null);
    };

    StockSchema.methods.addLogo = function (file) {
        if (!file) {
            this.logo = '';
            this.thumb = '';
            return;
        }

        var self = this;
        self.logo = '/stocks/' + file.filename;
        self.thumb = '/stocks/' + file.filename.split('.')[0] + '_thumb.' + file.filename.split('.')[1];

        var thumbnailFilename = __dirname + '/../public/stocks/' + file.filename.split('.')[0] + '_thumb.' + file.filename.split('.')[1];

        gm(__dirname + '/../public/stocks/' + file.filename)
            .resize(THUMBNAIL_WIDTH)
            .write(thumbnailFilename, function (err) {
                if (err) {
                    logger.error(err);
                    return;
                }

                logger.info('Создал и сохранил тамбнейл для акции ' + self._id);
            });
    };

    StockSchema.methods.checkOwner = function (companyID) {
        return this.company == companyID;
    };

    StockSchema.methods.removeImages = function (callback) {
        var imgPath = __dirname + '/../public' + this.logo;
        var thumbPath = __dirname + '/../public' + this.thumb;
        var self = this;

        fs.unlink(imgPath, (err) => {
            var Client = mongoose.model('Client');
            if (err) {
                callback(err);
                return;
            }

            logger.info('Удалил логотип акции ' + self._id);

            fs.unlink(thumbPath, (err) => {
                if (err) {
                    callback(err);
                    return;
                }

                logger.info('Удалил тамбнейл акции ' + self._id);
                callback(null);
            });
        });
    };

    StockSchema.methods.prepareRemove = function (callback) {
        var subscribers = this.subscribes;
        var self = this;

        this.removeImages((err) => {
            if (err) {
                callback(err);
                return;
            }

            var Client = mongoose.model('Client');

            Client.find({_id: {$in: subscribers}}, (err, clients) => {
                if (err) {
                    callback(err);
                    return;
                }

                clients.forEach((client) => {
                    client.unsubscribe(self._id.toString())
                });

                callback(null, 'ok');
            });
        });
    };

    StockSchema.methods.isSubscribed = function (userID) {
        return this.subscribes.indexOf(userID) != -1;
    };

    StockSchema.methods.toJSON = function (userID) {
        var self = this;
        return new Promise(function (resolve) {
            var Company = mongoose.model('Company');
            Company.findOne({'_id': new ObjectID(self.company)}, (err, company) => {
                if (err) {
                    logger.error(err);
                    throw err;
                }
                if (!company) {
                    logger.warn('У акции с айди ' + self.id + ' не указана компания или некорректный айди(id = ' + self.company + ')');
                    company = '';
                }
                resolve({
                    name: self.name,
                    description: self.description,
                    id: self._id,
                    logo: self.logo,
                    thumb: self.thumb,
                    company: company.toJSON(),
                    subscribed: (userID === undefined ? null : self.isSubscribed(userID)),
                    startDate: self.startDate,
                    endDate: self.endDate
                });
            });
        });
    };

    StockSchema.statics.allToJSON = function (userID, callback) {
        this.find({}, (err, stocks) => {
            if (err) {
                logger.error(err);
                throw err;
            }

            var promises = [];
            stocks.forEach((stock) => {
                promises.push(stock.toJSON(userID))
            });

            Promise.all(promises).then(function (stocks) {
                callback(stocks);
            });
        });
    };

    StockSchema.statics.byCompanyID = function (companyID, callback) {
        this.find({'company': companyID}, (err, stocks) => {
            if (err) {
                logger.error(err);
                throw err;
            }

            if (stocks.length == 0) {
                logger.info('У компании ' + companyID + ' нет акций');
                callback([]);
                return;
            }

            var promises = [];
            stocks.forEach((stock) => {
                promises.push(stock.toJSON())
            });
            Promise.all(promises).then((stocks) => {
                callback(stocks);
            });
        });
    };

    StockSchema.statics.byFilter = function (companyID, category, callback) {
        this.find({'company': companyID, 'category': category}, (err, stocks) => {
            if (err) {
                logger.error(err);
                throw err;
            }

            if (!stocks) {
                logger.info('Не найдено акций у компании ' + companyID + ' и категории ' + category);
                callback([]);
                return;
            }

            var promises = [];
            stocks.forEach((stock) => {
                promises.push(stock.toJSON())
            });
            Promise.all(promises).then((stocks) => {
                callback(stocks);
            });
        });
    };

    StockSchema.statics.getByID = function (id, callback) {
        this.findOne({'_id': id}, (err, stock) => {
            if (err) {
                callback(err);
                return;
            }

            if (!stock) {
                callback(new Error('Нет акции с айди ' + id));
                return;
            }

            stock.toJSON().then((stock) => {
                callback(null, stock);
            });
        });
    };

    StockSchema.pre('save', function (next) {
        logger.info('Сохраняю акцию ' + this._id);
        next();
    });

    mongoose.model('Stock', StockSchema);
    logger.info('Подключил модель Stock');
};
module.exports = function (logger) {
    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;
    var ObjectID = require('mongodb').ObjectID;

    var StockSchema = new Schema({
        name: String,
        description: String,
        company: String,
        logo: String,
        startDate: Date,
        endDate: Date
    });

    StockSchema.methods.addLogo = function (file) {
        if (!file) {
            this.logo = '';
            return;
        }
        this.logo = file.path.split('/').slice(1).join('/'); // отрезаем "public/"
    };

    StockSchema.methods.checkOwner = function (companyID) {
        return this.company == companyID;
    };

    StockSchema.methods.toJSON = function () {
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
                    company: {
                        name: company.name,
                        id: company._id
                    },
                    startDate: self.startDate,
                    endDate: self.endDate
                });
            });
        });
    };

    StockSchema.statics.allToJSON = function (callback) {
        this.find({}, (err, stocks) => {
            if (err) {
                logger.error(err);
                throw err;
            }

            var promises = [];
            stocks.forEach((stock) => {
                promises.push(stock.toJSON())
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
        this.findOne({'id': id}, (err, stock) => {
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
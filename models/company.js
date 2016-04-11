module.exports = function (logger) {
    var mongoose  = require('mongoose');
    var Schema    = mongoose.Schema;
    var User      = mongoose.model('User');
    var JSONError = require('../lib/json_error');
    var SHA256    = require('crypto-js/sha256');

    var CompanySchema = new Schema({
        name: String,
        INN: String,
        OGRN: String,
        category: Schema.Types.ObjectId,
        parentCompany: String,
        region: String,
        email: String,
        address: String,
        logo: String,
        type: String,
        subscribers: [Schema.Types.Object],
        active: Boolean,
        activationHash: String
    });

    CompanySchema.methods.toJSON = function () {
        var companyJSON =  {
            id: this._id,
            name: this.name,
            INN: this.INN,
            OGRN: this.OGRN,
            parentCompany: this.parentCompany,
            region: this.region,
            address: this.address,
            logo: this.logo
        };

        return companyJSON;
    };

    CompanySchema.methods.createImages = function(filename){
        if (!filename) {
            return;
        }

        this.logo = '/companies/' + filename;
    };

    CompanySchema.methods.generateActivationHash = function() {
        logger.info('Генерирую хэш для активации..');
        return SHA256(this.name + this.login + new Date().toDateString()).toString();
    };

    CompanySchema.methods.setActivationHash = function(hash) {
        var self = this;

        self.active = false;
        self.activationHash = hash;
        logger.info('Установил компании ' + self._id + ' хэш для активации (' + hash + ')');

        return new Promise(function(resolve, reject) {
            self.save((err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    };

    CompanySchema.methods.activate = function() {
        var self = this;

        this.activationHash = null;
        this.active = true;

        return new Promise(function(resolve, reject) {
            self.save((err) => {
                if (err) reject(err);

                logger.info('Компания с id ' + this._id + ' активировала е-майл')
                resolve();
            })
        });
    };

    CompanySchema.methods.isSubscribed = function (userID) {
        return this.subscribers.indexOf(userID) !== -1;
    };

    CompanySchema.methods.addSubscriber = function (subscriberID) {
        var self = this;

        return new Promise(function(resolve, reject) {
            if (self.isSubscribed(subscriberID)) {
                return reject(new JSONError('error', 'Этот пользователь уже есть в подписчиках'));
            }

            self.subscribers.push(subscriberID);
            self.save((err) => {
                if (err) return reject(err);

                logger.info('Добавил пользователя ' + subscriberID.toString() + ' к подписчикам компании ' + self._id.toString());
                resolve();
            });
        });
    };

    CompanySchema.methods.removeSubscriber = function (subcriberID) {
        var self = this;

        return new Promise(function(resolve, reject) {
            if (!self.isSubscribed(subscriberID)) {
                return reject(new JSONError('error', 'Этого пользователя нет в подписчиках'));
            }

            this.subscribers.splice(self.subscribers.indexOf(subcriberID), 1);
            this.save((err) => {
                if (err) return reject(err);

                logger.info('Удалил пользователя ' + id.toString() + ' из подписчиков компании ' + this._id.toString());
                resolve();
            });
        });
    };

    CompanySchema.statics.findAndActivateByHash = function(hash) {
        var self = this,
            searchQuery = {
                activationHash: hash
            };

        return new Promise(function(resolve, reject) {
            self.findOne(searchQuery, (err, company) => {
                if (err) return reject(err);

                if (!company) 
                    return reject(new Error('Нет такой компании или уже активирована'));

                return company.activate();
            });
        });

    };

    // Наследование от общего абстрактного класса
    User.discriminator('Company', CompanySchema);
    logger.info('Подключил модель Company');
};

module.exports = function(logger) {
    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;
    var SHA256 = require("crypto-js/sha256");


    var UserSchema = new Schema({
        login: String,
        hashedPassword: String,
        address: String,
        filters: [{id: String, name: String}],
        FIO: String,
        friends: [{id: String}],
        mail: String,
        phone: String,
        token: {
            value: String,
            createdAt: Date,
            expiredAt: Date
        },
        stocks: [{id: String, name: String}]
    });

    UserSchema.virtual('password').set(function(pass){
        this.hashedPassword = SHA256(pass).toString();
    });

    UserSchema.methods.checkPassword = function (pass) {
        return this.hashedPassword == SHA256(pass).toString();
    };

    UserSchema.methods.getToken = function () {
        if (this.token.value == null || this.token.expiredAt < new Date()) {
            logger.info('Токен пользователя ' + this.login + ' устарел или не существует');
            this.token = {
                createdAt: new Date(),
                expiredAt: new Date(new Date().setDate(new Date().getDate() + 10)),
                value: Math.random() + ''
            };
            logger.info('Сгенерировал новый токен(' + this.token.value + ')');
            this.save();
        }

        return this.token.value;
    };

    UserSchema.pre('save', function(next) {
        logger.info('Сохраняю пользователя ' + this.login + ' (id = ' + this.id + ')');
        next();
    });

    mongoose.model('User', UserSchema);
    logger.info('Подключил модель User');
};
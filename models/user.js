module.exports = function (logger) {
    var mongoose   = require('mongoose'),
        Schema     = mongoose.Schema,
        JSONError  = require('../lib/json_error'),
        SHA256     = require('crypto-js/sha256'),
        dateHelper = require('../utils/dateHelper');

    var UserSchema = new Schema({
        login: {
            type: String,
            required: true
        },
        hashedPassword: {
            type: String,
            required: true
        },
        token: {
            value: String,
            createdAt: Date,
            expiredAt: Date
        }
    });

    UserSchema.virtual('password').set(function (pass) {
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
                expiredAt: dateHelper.getDateAfter(10),
                value: SHA256(this.hashedPassword + this.login)
            };
            logger.info('Сгенерировал новый токен(' + this.token.value + ')');
            this.save();
        }

        return this.token.value;
    };

    UserSchema.statics.byLogin = function (login, callback) {
        this.findOne({'login': login}, (err, user) => {
            if (err) {
                callback(err);
                return;
            }

            if (!user){
                callback(new JSONError('error', 'Не найден юзер с логином ' + login, 404));
                return;
            }

            callback(null, user);
        });
    };

    UserSchema.statics.authorize = function(login, password, callback) {
        this.byLogin(login, (err, user) => {
            if (err) {
                callback(err);
                return;
            }

            if (user.checkPassword(password)){
                callback(null, user);
            } else {
                callback(new JSONError('error', 'Неправильный пароль!'));
            }
        });
    };

    UserSchema.pre('save', function (next) {
        logger.info('Сохраняю пользователя ' + this.login + ' (id = ' + this.id + ')');
        next();
    });

    mongoose.model('User', UserSchema);
    logger.info('Подключил абстрактный класс для компании и клиента');
};

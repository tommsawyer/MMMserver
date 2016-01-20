var mongoose  = require('mongoose');
var JSONError = require('../lib/json_error');

module.exports = {
    checkLoginAndPassword: function(req, res, next) {
        var loginRegExp = /[a-zA-Z]{5,}/;
        var passwordRegExp = /.{5,20}/;

        if (!(req.body.password && req.body.login)) {
            return next(new JSONError('error', 'Нет логина или пароля в запросе регистрации'));
        }

        if (!req.body.login.match(loginRegExp)) {
            return next(new JSONError('error', 'Некорректный логин'));
        }

        if (!req.body.password.match(passwordRegExp)) {
            return next(new JSONError('error', 'Некорректный пароль'));
        }

        next();
    },

    checkCompanyToken: function(req, res, next) {
        var Company = mongoose.model('Company');

        var token = req.body.token || req.query.token;

        Company.findOne({'token.value': token}, (err, company) => {
            if (err) {
                return next(err);
            }

            if (!company || !token) {
                req.logger.warn('Не найдена компания с токеном ' + token);
                return next();
            }

            if (!company.active){
                res.logger.warn('Запрос от неактивированной компании');
                return next();
            }

            req.company = company;
            next();
        });
    },

    checkClientToken: function(req, res, next) {
        var Client = mongoose.model('Client');

        var token = req.body.token || req.query.token;

        Client.findOne({'token.value': token}, (err, user) => {
            if (err) {
                return next(err);
            }

            if (!user || !token) {
                req.logger.warn('Не найден юзер с токеном ' + token);
                return next();
            }

            req.user = user;
            next();
        });
    },

    requireCompanyAuth: function(req, res, next){
        if (!req.company){
            return next(new JSONError('error', 'Доступ запрещен', 403));
        }

        next();
    },

    requireClientAuth: function(req, res, next){
        if (!req.user){
            return next(new JSONError('error', 'Доступ запрещен', 403));
        }

        next();
    },

    requireAnyAuth: function(req, res, next){
        if (!req.company && !req.user){
            return next(new JSONError('Доступ запрещен', 'error', 403));
        }

        next();
    }
};
var mongoose = require('mongoose');

module.exports = {
    checkLoginAndPassword: function(req, res, next) {
        var loginRegExp = /[a-zA-Z]{5,}/;
        var passwordRegExp = /.{5,20}/;

        if (!(req.body.password && req.body.login)) {
            req.logger.warn('Нет логина или пароля в запросе регистрации');
            res.end(req.msgGenerator.generateJSON('error', 'Нет логина или пароля в запросе регистрации'));
            return;
        }

        if (!req.body.login.match(loginRegExp)) {
            req.logger.warn('Некорректный логин при регистрации: ' + req.body.login);
            res.end(req.msgGenerator.generateJSON('error', 'Некорректный логин'))
            return;
        }

        if (!req.body.password.match(passwordRegExp)) {
            req.logger.warn('Некорректный пароль при регистрации: ' + req.body.password);
            res.end(req.msgGenerator.generateJSON('error', 'Некорректный пароль'))
            return;
        }

        next();
    },

    checkCompanyToken: function(req, res, next) {
        var Company = mongoose.model('Company');

        var token = req.body.token || req.query.token;

        Company.findOne({'token.value': token}, (err, company) => {
            if (err) throw err;

            if (!company || !token) {
                req.logger.warn('Не найдена компания с токеном ' + token);
                res.end(req.msgGenerator.generateJSON('error', 'Некорректный токен'));
                return;
            }

            if (!company.active){
                res.logger.warn('Запрос от неактивированной компании');
                res.end(req.msgGenerator.generateJSON('error', 'Компания не подтвердила е-мейл'));
                return;
            }

            req.company = company;
            next();
        });
    },

    checkClientToken: function(req, res, next) {
        var Client = mongoose.model('Client');

        var token = req.body.token || req.query.token;

        Client.findOne({'token.value': token}, (err, user) => {
            if (err) throw err;

            if (!user || !token) {
                req.logger.warn('Не найден юзер с токеном ' + token);
                res.end(req.msgGenerator.generateJSON('error', 'Некорректный токен'));
                return;
            }

            req.client = user;
            next();
        });
    },

    requireCompanyAuth: function(req, res, next){
        if (!req.company){
            next(new Error('Доступ запрещен'));
        }
        next();
    },

    requireClientAuth: function(req, res, next){
        if (!req.client){
            next(new Error('Доступ запрещен'));
        }
        next();
    },

    requireAnyAuth: function(req, res, next){
        if (!req.company && !req.client){
            next(new Error('Доступ запрещен'));
        }
    }
};
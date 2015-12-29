var nodemailer = require('nodemailer');
var Logger     = require('./logger.js');
var config     = require('../configs/mail.json');
var logger     = new Logger();

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: config.login,
        pass: config.password
    }
}, {
    from: config.from
});

sendActivationEmail = function(address, hash) {
    var mailOptions = {
        to: address,
        subject: 'Подтверждение регистрации на МММ',
        html: 'Подтвердите регистрацию кликнув по этой ссылке: <a href="' + config.href + hash +'">Подтвердить</a>'
    };

    transporter.sendMail(mailOptions, function(err, info) {
        if (err) {
            logger.error(err);
            return;
        }

        logger.info('Отправил активационное сообщение на е-мейл. ' + info.response);
    });
};

module.exports.sendActivationEmail = sendActivationEmail;
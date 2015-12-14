module.exports = function (logger) {
    var mongoose = require('mongoose');
    var Schema   = mongoose.Schema;
    var User     = mongoose.model('User');

    var ClientSchema = new Schema({
        address: String,
        filters: [{id: String, name: String}],
        FIO: String,
        friends: [{id: String}],
        mail: String,
        phone: String,
        stocks: [{id: String, name: String}]
    });

    User.discriminator('Client', ClientSchema);
    logger.info('Подключил модель Client');
};
module.exports = function (logger) {
    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;

    var CompanySchema = new Schema({
        login: String,
        hashedPassword: String,
        name: String,
        INN: String,
        OGRN: String,
        parentCompany: String,
        region: String,
        address: String,
        logo: String,
        token: {
            value: String,
            createdAt: Date,
            expiredAt: Date
        },
        type: String
    });

    CompanySchema.methods.getToken = function () {
        if (!this.token || this.token.value == null || this.token.expiredAt < new Date()) {
            logger.info('Токен компании ' + this.login + ' устарел или не существует');
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

    CompanySchema.methods.toJSON = function () {
        var company =  {
            id: this._id,
            name: this.name,
            INN: this.INN,
            OGRN: this.OGRN,
            parentCompany: this.parentCompany,
            region: this.region,
            address: this.address,
            logo: this.logo
        };

        return company;
    };


    CompanySchema.pre('save', function (next) {
        logger.info('Сохраняю компанию ' + this.login + ' (id = ' + this.id + ')');
        next();
    });

    mongoose.model('Company', CompanySchema);
    logger.info('Подключил модель Company');
};

module.exports = function (logger) {
    var mongoose = require('mongoose');
    var Schema   = mongoose.Schema;
    var User     = mongoose.model('User');

    var CompanySchema = new Schema({
        name: String,
        INN: String,
        OGRN: String,
        parentCompany: String,
        region: String,
        address: String,
        logo: String,
        type: String
    });

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

    User.discriminator('Company', CompanySchema);
    logger.info('Подключил модель Company');
};

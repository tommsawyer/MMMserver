module.exports = function (logger) {
    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;
    var ObjectID = require('mongodb').ObjectID;
    var JSONError = require('../lib/json_error');

    var CategorySchema = new Schema({
        name: String,
        parentCategory: Schema.Types.ObjectId
    });



    CategorySchema.statics.toJSON = function (callback) {
        this.find({}, (err, categories) => {
            if (err) {
                callback(err);
            }

            var byParent = function (data, parent) {
                var arrayCopy = data.slice(0);

                return arrayCopy.filter(function (element) {
                    return element.parentCategory == parent;
                }).map(function (el) {
                    return {
                        id: el._id,
                        name: el.name
                    }
                });
            };

            var parseData = function (data, parent) {
                var result = byParent(data, parent);

                result.forEach(function (element) {
                    element.children = parseData(data, element.id.toString());
                });

                return result;
            };

            callback(null, parseData(categories, undefined));
        });
    };

    mongoose.model('Category', CategorySchema);
    logger.info('Подключил модель категорий');
};
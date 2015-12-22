var multer = require('multer');
var mime   = require('mime');
var SHA256 = require('crypto-js/sha256');

module.exports = {
    companyStorage: multer.diskStorage({
            destination: function (req, file, cb) {
                cb(null, __dirname + '/../public/companies')
            },
            filename: function (req, file, cb) {
                cb(null, SHA256(file.fieldname + Date.now()) + '.' + mime.extension(file.mimetype))
            }
        }),

    stockStorage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, __dirname + '/../public/stocks')
        },
        filename: function (req, file, cb) {
            cb(null, SHA256(file.fieldname + Date.now()) + '.' + mime.extension(file.mimetype))
        }
    })
    };
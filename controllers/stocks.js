var express   = require('express');
var router    = express.Router();
var mongoose  = require('mongoose');
var mw        = require('../utils/middlewares.js');
var Stock     = mongoose.model('Stock');
var ObjectID  = require('mongodb').ObjectID;
var multer    = require('multer'); // миддлвеар для загрузки файлов
var stockLogo = multer({dest: 'public/stocks'});

router.post('/create', stockLogo.single('logo'), mw.requireCompanyAuth, (req, res) => {
    if (!req.file){
        req.logger.warn('Запрос создания акции без логотипа');
    }

    var stock = new Stock({
        name: req.body.name,
        description: req.body.description,
        company: req.company._id,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate)
    });
    stock.addLogo(req.file);

    stock.save((err, stock) => {
        if (err) {
            req.logger.error(err);
            throw err;
        }
        res.end(req.msgGenerator.generateJSON('stock', stock._id));
    });
});

router.post('/edit', mw.requireCompanyAuth, (req, res) => {
   Stock.findOne({_id: new ObjectID(req.body.id)}, (err, stock) => {
       if (err) throw err;

       if (!stock) {
           res.end(req.msgGenerator.generateJSON('error', 'Нет такой акции'));
           return;
       }

       if (stock.company != req.company.id) {
           res.end(req.msgGenerator.generateJSON('error', 'Вы не можете редактировать эту акцию'));
           return;
       }

       stock.name = req.body.name;
       stock.description = req.body.description;
       stock.endDate = new Date(req.body.endDate);

       stock.save((err) => {
           if (err) throw err;
           res.end(req.msgGenerator.generateJSON('stock', 'успешно'));
       });
   });
});

router.get('/all', mw.requireUserAuth, (req, res) => {
    Stock.allToJSON(function(stocks){
        res.end(req.msgGenerator.generateJSON('stock', stocks));
        req.logger.info('Отправил клиенту все акции');
    });
});

router.get('/info', mw.requireUserAuth, (req, res) => {
    if (!req.query.id) {
        req.logger.warn('В запросе нет айди для поиска акции');
        res.end(req.msgGenerator.generateJSON('error', 'Не указан айди нужной акции'));
        return;
    }

    Stock.findOne({'_id':req.query.id}, (err, stock) => {
        if (err) throw err;
        if (!stock) {
            req.logger.warn('Не существует акции с айди ' + req.query.id);
            res.end(req.msgGenerator.generateJSON('Не существует акции с айди ' + req.query.id));
            return;
        }

        stock.toJSON().then(function(stock){
            req.logger.info('Отправляю информацию о акции с айди ' + req.query.id);
            res.end(req.msgGenerator.generateJSON('stock', stock));
        });
    });
});

router.get('/company', mw.requireCompanyAuth, (req, res) => {
    Stock.byCompanyID(req.company._id, (stocks) => {
        req.logger.info('Отправляю клиенту акции компании ' + req.company.login);
        res.end(req.msgGenerator.generateJSON('stock', stocks));
    });
});

router.get('/subscribitions', mw.requireUserAuth, (req, res) => {

});

router.get('/byfilter', mw.requireUserAuth, (req, res) => {

});

module.exports = router;

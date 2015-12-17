var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var mw = require('../utils/middlewares.js');
var Stock = mongoose.model('Stock');
var ObjectID = require('mongodb').ObjectID;
var multer = require('multer'); // миддлвеар для загрузки файлов
var storages = require('../utils/storages.js');
var stockLogo = multer({storage: storages.stockStorage});

router.post('/create', stockLogo.single('logo'), mw.requireCompanyAuth, (req, res) => {
    if (!req.file) {
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
        if (req.msgGenerator.generateError(err, req, res)) {
            return;
        }

        res.end(req.msgGenerator.generateJSON('stock', {id: stock._id, logo: stock.logo}));
    });
});

router.post('/edit', stockLogo.single('logo'), mw.requireCompanyAuth, (req, res) => {
    if (!req.file) {
        req.logger.warn('Запрос редактирования акции без логотипа');
    }

    Stock.getByID(new ObjectID(req.body.id), (err, stock) => {
        if (req.msgGenerator.generateError(err, req, res)) {
            return;
        }

        if (!stock.checkOwner(req.company._id)) {
            res.end(req.msgGenerator.generateJSON('error', 'Вы не можете редактировать эту акцию'));
            return;
        }

        stock.addLogo(req.file);

        stock.name = req.body.name;
        stock.description = req.body.description;
        stock.endDate = new Date(req.body.endDate);

        stock.save((err) => {
            if (err) throw err;
            res.end(req.msgGenerator.generateJSON('stock', 'успешно'));
        });
    });
});

router.post('/remove', mw.requireCompanyAuth, (req, res) => {
    Stock.findOne({_id: req.body.id}, (err, stock) => {
        if (req.msgGenerator.generateError(err, req, res)) {
            return;
        }

        if (!stock) {
            res.end(req.msgGenerator.generateJSON('error', 'Нет такой акции!'));
            return;
        }

        if (!stock.checkOwner(req.company._id.toString())) {
            res.end(req.msgGenerator.generateJSON('error', 'Эта компания не имеет прав для удаления этой акции'));
            return;
        }

        stock.prepareRemove((err) => {
            if (req.msgGenerator.generateError(err, req, res)) {
                return;
            }

            res.end(req.msgGenerator.generateJSON('stock', stock._id));
            req.logger.info('Акция с айди ' + stock._id + ' удалена');
            stock.remove();
        });
    });
});

router.get('/all', mw.requireClientAuth, (req, res) => {
    Stock.allToJSON(function (stocks) {
        res.end(req.msgGenerator.generateJSON('stock', stocks));
        req.logger.info('Отправил клиенту все акции');
    });
});

router.get('/info', mw.requireClientAuth, (req, res) => {
    if (!req.query.id) {
        req.logger.warn('В запросе нет айди для поиска акции');
        res.end(req.msgGenerator.generateJSON('error', 'Не указан айди нужной акции'));
        return;
    }

    Stock.getByID(new ObjectID(req.query.id), (err, stock) => {
        if (req.msgGenerator.generateError(err, req, res)) {
            return;
        }

        req.logger.info('Отправляю информацию о акции с айди ' + req.query.id);
        res.end(req.msgGenerator.generateJSON('stock', stock));
    });
});

router.get('/company', mw.requireCompanyAuth, (req, res) => {
    Stock.byCompanyID(req.company._id, (stocks) => {
        req.logger.info('Отправляю клиенту акции компании ' + req.company.login);
        res.end(req.msgGenerator.generateJSON('stock', stocks));
    });
});

module.exports = router;

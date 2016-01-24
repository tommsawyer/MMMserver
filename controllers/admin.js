var express = require('express');
var router  = express.Router();
var path    = require('path');
var mongoose = require('mongoose');
var Category = mongoose.model('Category');
var ObjectID = require('mongodb').ObjectId;

router.get('/logs', (req, res) => {
    res.sendFile(path.resolve(__dirname + '/../logs/log.txt'));
});

router.get('/clearlogs', (req, res) => {
    req.logger.clearLog();
    req.logger.info('Очищен лог-файл');
    res.JSONAnswer('Clear logs', 'success');
});

router.post('/category', (req, res) => {
    var parentCategory = null;

    if (req.body.parent) {
        parentCategory = new ObjectID(req.body.parent);
    }

    Category.create({
        name: req.body.name,
        parentCategory: parentCategory
    });
    res.end('OK');
});

module.exports = router;
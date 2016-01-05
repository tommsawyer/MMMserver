var express = require('express');
var router  = express.Router();
var path    = require('path');

router.get('/logs', (req, res) => {
    res.sendFile(path.resolve(__dirname + '/../logs/log.txt'));
});

router.get('/clearlogs', (req, res) => {
    req.logger.clearLog();
    req.logger.info('Очищен лог-файл');
    res.JSONAnswer('Clear logs', 'success');
});

module.exports = router;
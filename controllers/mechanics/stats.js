var express  = require('express');
var mw       = require('../../utils/middlewares.js');
var mongoose = require('mogoose');
var router   = express.Router();
var Company  = mongoose.model('Company');

router.get('datesperstock', mw.requireCompanyAuth, (req, res, next) => {

});

module.exports = router;
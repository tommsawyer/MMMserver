module.exports = function(logger) {
    require('./user.js')(logger);
    require('./stock.js')(logger);
    require('./client.js')(logger);
    require('./company.js')(logger);
};
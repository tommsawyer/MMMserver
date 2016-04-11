var SEC = 1000,
    MIN = 60 * SEC,
    HOUR = 60 * MIN,
    DAY = 24 * HOUR;

module.exports = {
    tryParseDate: function(date) {
        var parsedDate = Date.parse(date);
        if (isNaN(parsedDate)) {
            return false;
        } else {
            return new Date(parsedDate);
        }
    },

    isCurrentDateBetween: function(startDate, endDate) {
        var currentDate = new Date();
        return startDate && endDate && 
               startDate < endDate && 
               endDate   > currentDate;
    },

    getDateAfter: function(days, hours, minutes, seconds, milliseconds) {
        var ms = (days * DAY || 0) + (hours * HOUR|| 0) + (minutes * MIN || 0) + (seconds * SEC || 0) + (milliseconds || 0);
        return new Date(Date.now() + ms);
    }
}
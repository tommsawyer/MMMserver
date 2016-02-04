module.exports = {
    tryParseDate: function(date) {
        var parsedDate = Date.parse(date);
        if (isNaN(parsedDate)) {
            return false;
        } else {
            return new Date(parsedDate);
        }
    },

    checkDates: function(startDate, endDate) {
        var currentDate = new Date();
        return startDate && endDate && startDate < endDate && endDate > currentDate;
    }
}
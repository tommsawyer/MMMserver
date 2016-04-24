function generateSubscriptionCode() {
    // subscription code is string representation of random ten-digit number
    return (Math.random() * 1e10).toString();
};

var SubscriptionManager = {
    generateSubscription: function(userID) {
        return {
            id: userID,
            date: new Date(),
            code: generateSubscriptionCode(),
            numberOfUses: 0
        }
    }


};

module.exports = SubscriptionManager;
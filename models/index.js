module.exports = function(logger) {
    const modelFiles = [
        'user.js',
        'stock.js',
        'client.js',
        'company.js',
        'category.js',
        'archived_subscription.js'
    ];

    modelFiles.forEach((model) => {
       require('./' + model)(logger);
    });
};
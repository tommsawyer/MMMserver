var StatusCodes = {
    NOT_FOUND: 404,
    OK: 200,
    INTERNAL_ERROR: 500,
    NOT_ENOUGH_RIGHTS: 403
};

var Messages = {
    NOT_ENOUGH_SUBSCRIPTION_RIGHTS: 'Вы не имеете права просматривать информацию об этой подписке'
};

module.exports = {
    codes: StatusCodes,
    messages: Messages
};
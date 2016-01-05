'use strict';

var util   = require('util');

class JSONError {
    constructor(type, message, code) {
        this.type    = type    || 'error';
        this.message = message || 'Internal server error';
        this.code    = code    || 500;
    }

    toClient() {
        return JSON.stringify({
            'type': this.type,
            'data': this.message
        });
    }
}

// наследование от стандартной ошибки
util.inherits(JSONError, Error);

module.exports = JSONError;

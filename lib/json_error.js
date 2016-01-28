'use strict';

class JSONError extends Error {
    constructor(type, message, code) {
        super();
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

module.exports = JSONError;

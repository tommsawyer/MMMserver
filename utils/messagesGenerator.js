'use strict';

class MessagesGenerator {
    constructor() {
    }

    generateJSON(type, message) {
        var obj = {
            type: type,
            data: message
        }

        return JSON.stringify(obj);
    }

    generateError(err, req, res) {
        if (err) {
            req.logger.error(err);
            res.end(req.msgGenerator.generateJSON('error', err.message));
            return true;
        } else {
            return false;
        }
    }
}

module.exports = new MessagesGenerator();
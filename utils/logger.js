'use strict';

var fs = require('fs');
var JSONError = require('../lib/json_error');

class Logger {
    constructor() {
        this.logFile = __dirname + '/../logs/log.txt';
    }

    getTime() {
        return new Date().toTimeString().split(' ')[0]
    }

    printMessage(message) {
        var msg = this.getTime() + ' -- ' + message;
        fs.appendFile(this.logFile, msg + '\n', (err) => {
            if (err) throw err;
        });
        console.log(msg);
    }

    clearLog() {
        fs.writeFile(this.logFile, '', (err) => {
            if (err) throw err;
        });
    }

    info(message) {
        this.printMessage('(INFO) ' + message);
    }

    warn(message) {
        this.printMessage('(WARN) ' + message);
    }

    error(err) {
        if (err instanceof JSONError) {
            this.printMessage('(ERROR!) ' + err.message + ' [' + err.code + ', ' + err.type + ']' );
        } else {
            if (err instanceof Error) {
                this.printMessage('(ERROR!) ' + err.message + '\n' + err.stack.split('\n').slice(1).join('\n'));
            } else {
                this.printMessage('(ERROR!) ' + err);
            }
        }
    }
}

module.exports = Logger;
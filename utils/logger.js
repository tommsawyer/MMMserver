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

    _isObject(obj) {
        return Object.prototype.toString.call(obj) === '[object Object]';
    }

    _inspect(obj) {
        var result = "{"
        for (var key in obj) {
            if (this._isObject(obj[key])) {
                result += key + ': ' + this._inspect(obj[key]);
            } else if (obj[key] instanceof Array) {
                result += key + ': [';
                obj[key].forEach((element) => {
                    result += this._inspect(element) + ', ';
                });
                result += '] ';
            } else {
                result += key + ': ' + obj[key] +'; ';
            }
        }
        result += '}';
        return result;
    }

    inspect(msg, obj) {
        this.info(msg + ' ' + this._inspect(obj));
    }
}

module.exports = Logger;
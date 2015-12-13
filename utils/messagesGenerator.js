'use strict';

class MessagesGenerator{
    constructor(){}

    generateJSON(type, message){
        var obj = {
            type: type,
            data: message
        }

        return JSON.stringify(obj);
    }
}

module.exports = new MessagesGenerator();
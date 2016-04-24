var Errors = {
    // Друзья
    CLIENT_ALREADY_IN_FRIENDS: 'Этот пользователь уже в друзьях',
    CLIENT_NOT_IN_FRIENDS:     'Этого пользователя нет в друзьях'
};

var Answers = {
    OK:            'success',
    // Друзья
    ADD_FRIEND:    'addfriend',
    DELETE_FRIEND: 'deletefriend',
    ALL_FRIENDS:   'allfriends'
};

var StringResources = {
    errors: Errors,
    answers: Answers
};

module.exports = StringResources;
var request = require('../request');

describe('Клиент', function() {
    describe('Регистрация', function () {
        it('Должен регистрировать нового пользователя с корректными данными', function (done) {
            request
                .post('/user/register')
                .field('login', 'testlogin')
                .field('password', 'testpassword')
                .set('Accept', 'application/json')
                .expect(200, {

                }, done);
        });
    });
});
const supertestWithCsrf = require('../utils/supertestWithCsrf');

function expectLogout() {
    return supertestWithCsrf
        .get(sails.getUrlFor('account/logout'))
        .expect('OK');
}

module.exports = expectLogout;

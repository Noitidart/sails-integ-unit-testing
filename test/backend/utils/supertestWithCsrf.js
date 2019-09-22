const supertest = require('supertest');

module.exports = new Proxy(
  {},
  {
    get: (_, method) => (...args) =>
      supertest(sails.hooks.http.app)
        [method](...args)
        .set('Cookie', SAILS_SID_COOKIE)
        .set('X-CSRF-Token', CSRF_TOKEN)
  }
);

/**
 * Singleton
 */
class SailsTest {

  static getInstance() {
    return SailsTest.instance;
  }

  constructor() {
    if (SailsTest.getInstance()) {
      return SailsTest.getInstance();
    }
    SailsTest.instance = this;
  }

  /**
   * Before running any tests...
   * This needs to run in mocha scope so it can do `this.timeout()`.
   */
  async setup() {
    const sails = new require('sails').Sails();

    // Increase the Mocha timeout so that Sails has enough time to lift, even if you have a bunch of assets.
    if (this.timeout) {
      this.timeout(30000);
    }

    const port = 1313;

    const liftErr = await new Promise(resolve =>
      sails.lift(
        {
          port,
          custom: {
            baseUrl: 'http://localhost:' + port
          },
          datastores: {
            default: {
              adapter: 'sails-mongo',
              url: 'mongodb://localhost:27017/cloud-kitchens-test',
            },
          },
          hooks: {
            grunt: false,
            apianalytics: false
          },
          log: {
            // Disable all logs except errors and warnings
            level: 'warn'
          },
          models: {
            migrate: 'drop'
          },
          routes: {
            // Provide a way to get a CSRF token:
            'GET /.temporary/csrf/token/for/tests': { action: 'security/grant-csrf-token' },
            'GET /.temporary/socket/id/for/tests': {
              isSocket: true,
              fn: function(req, res) {
                return res.send(sails.sockets.getId(req));
              }
            }
          },
          policies: {
            // Poke a hole in any global policies to ensure the test runner can
            // actually get access to a CSRF token.
            'security/grant-csrf-token': true,
          }
        },
        resolve
      )
    );

    if (liftErr) {
      throw liftErr;
    } else {
      // here you can load fixtures, etc.
      // (for example, you might want to create some records in the database)

      // Do request for getting CSRF material (token and cookie) for Cloud and supertest

      const res = await sails.helpers.http.sendHttpRequest.with({
        method: 'GET',
        url: '.temporary/csrf/token/for/tests',
        baseUrl: sails.config.custom.baseUrl
      });

      if (global.CSRF_TOKEN) throw new Error('Test runner cannot expose `CSRF_TOKEN` -- that global already exists!');

      try {
        global.CSRF_TOKEN = sails.config.security.csrf ? JSON.parse(res.body)._csrf : undefined;
      } catch(err) {
        throw new Error('Test runner could not parse CSRF token from the Sails server.\nDetails:\n'+err.stack);
      }

      if (global.SAILS_SID_COOKIE) throw new Error('Test runner cannot expose `SAILS_SID_COOKIE` -- that global already exists!');

      try {
        global.SAILS_SID_COOKIE = res.headers['set-cookie'][0].split(';')[0].trim();
      } catch(err) {
        throw new Error('Test runner could not parse the `set-cookie` response header from the Sails server.\nDetails:\n'+err.stack);
      }
    }
  }

  // After all tests have finished...
  async teardown() {
    // here you can clear fixtures, etc.
    // (e.g. you might want to destroy the records you created above)

    // stop the backend server because if something after this needs need to run another server
    // it will collide and fail with this running instance
    if (sails) sails.lower();

    // so garbage collection doesn't have anything useless laying around it is useless
    // because a lowered sails server, cannot be re-lifted, a new instanceh has to be made
    sails = null;
  }
}

new SailsTest();

module.exports = SailsTest;

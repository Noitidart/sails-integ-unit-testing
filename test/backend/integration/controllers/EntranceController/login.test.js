const supertestWithCsrf = require('../../../utils/supertestWithCsrf');
const createFake = require('../../../utils/createFake');
const cleanDatabase = require('../../../utils/cleanDatabase');

describe('EntranceController.login', () => {

  let user;

  before(async () => {

    user = await createFake(User);

  });

  after(async () => {

    await supertestWithCsrf.get(sails.getUrlFor('account/logout')).expect(200).expect('OK');

    await cleanDatabase();

  });

  it('exits with badCombo when email and password are bad', async () => {

    await supertestWithCsrf
      .put('/api/v1/entrance/login')
      .send({
        emailAddress: 'fooEmail',
        password: 'fooPassword'
      })
      .expect(401)
      .expect('Unauthorized')
      .expect('X-Exit', 'badCombo')
      .expect('X-Exit-Description', 'The provided email and password combination does not match any user in the database.');

  });

  it('logs in succesfully', async () => {

    await supertestWithCsrf
      .put(sails.getUrlFor('entrance/login'))
      .send({
        emailAddress: user.emailAddress,
        password: user.password
      })
      .expect(200)
      .expect('OK')
      .expect('X-Exit', 'success')
      .expect('X-Exit-Description', 'The requesting user agent has been successfully logged in.');

  });

});

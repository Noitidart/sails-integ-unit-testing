const expectLogout = require('./expectLogout');

const BOOTSTRAP_USER_EMAILS = ['admin@example.com'];

/**
 * Restores database to the state it was at after bootstrap was initially run.
 * For the most part, like if the one of the boostrap users was updated, then
 * that updateAt field is not reverted. Also logs out the current user.
 *
 * @returns {Promise<void>}
 */
async function cleanDatabase() {
  await expectLogout();

  // order matters until I figure out the delete order issue
  const models = [
    User,
    Order,
  ];

  for (const model of models) {
    if (model !== User) {
      await model.destroy({});
      await expect(model.find()).to.eventually.be.an('array').that.is.empty;
    }
  }


  // delete all but users that come out of bootstrap
  const bootstrapUserIds = (await User.find({
    emailAddress: BOOTSTRAP_USER_EMAILS.map(user => user.emailAddress)
  })).map(user => user.id);
  await User.destroy({ id: { '!=': bootstrapUserIds } });
  await expect(User.find()).to.eventually.be.an('array').that.has.lengthOf(bootstrapUserIds.length);
}

module.exports = cleanDatabase;

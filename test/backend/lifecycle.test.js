const SailsTest = require('./SailsTest');

before(async function() {
  await SailsTest.getInstance().setup.call(this);
});

after(async () => {
  await SailsTest.getInstance().teardown();
});

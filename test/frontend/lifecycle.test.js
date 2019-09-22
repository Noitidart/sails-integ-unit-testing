const puppeteer = require('puppeteer');
const SailsTest = require('../backend/SailsTest');

before(async function() {
  await SailsTest.getInstance().setup.call(this);

  global.browser = await puppeteer.launch({
    // headless: false,
    // slowMo: 50
  });

});

after(async () => {

  if (browser) await browser.close();

  await SailsTest.getInstance().teardown();

});

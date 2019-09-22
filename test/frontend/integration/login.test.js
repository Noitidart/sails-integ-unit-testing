const createFake = require('../../backend/utils/createFake');

describe('Login page', () => {

  let page;
  let user;

  before(async () => {

    page = await browser.newPage();
    user = await createFake(User);

  });

  after(async () => {
    await page.close();
  });

  it('has a form that logs the user in', async () => {

    await page.goto(sails.config.custom.baseUrl + sails.getUrlFor('entrance/view-login'));
    await page.waitForSelector('button[type=submit]');
    await page.type('input[type=email]', user.emailAddress);
    await page.type('input[type=password]', user.password);
    await page.click('button[type=submit]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    const h1Text = await page.$eval('h1', el => el.textContent);
    expect(h1Text).to.equal('Cloud Kitchens.');

  });
});

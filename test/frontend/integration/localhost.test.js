
describe(`Local app availability at "sails.config.custom.baseUrl"`, () => {
  let page;

  before(async () => {
    page = await browser.newPage();
  });

  after(async () => {
    await page.close();
  });

  it('loads', async () => {
    await page.goto(sails.config.custom.baseUrl);
    await expect(page.title()).to.eventually.equal('NEW_APP_NAME');
  });
});

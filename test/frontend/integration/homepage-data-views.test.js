const cleanDatabase = require('../../backend/utils/cleanDatabase');
const createFakeParams = require('../../backend/utils/createFakeParams');

const OrderModel = require('../../../api/models/Order');
const { OrderStatus } = require('../../../types');

describe.only('Homepage <DataViews>', function() {
  let page;
  let page2;
  let order;
  let order2;

  before(async () => {
    ([page, page2] = [await browser.newPage(), await browser.newPage()]);
    await Promise.all([
      page.goto(sails.config.custom.baseUrl),
      page2.goto(sails.config.custom.baseUrl)
    ]);
  });

  after(async () => {
    await page.close();
  });

  it('starts off in loading state', async () => {
    await page.waitForSelector('p.lead.text-center');
    await expect(page.$eval('p.lead.text-center', el => el.textContent)).to.eventually.be.equal('Loading...');
  });

  it('shows no orders message after fetch request settles', async () => {
    await page.waitForXPath(`//p[contains(., 'No orders')]`);
    await expect(page.$eval('p.lead.text-center', el => el.textContent)).to.eventually.be.equal('No orders');
  });

  it('starts off with active orders view', async () => {
    await expect(page.$eval('h2', el => el.textContent)).to.eventually.be.equal('Active Orders');
  });

  it('has a button to show historical view that does another request for orders', async () => {
    await expect(page.$eval('button.float-right', el => el.textContent)).to.eventually.be.equal('View History');
    await page.click('button.float-right');
    await expect(page.waitForXPath(`//p[contains(., 'Loading...')]`)).to.eventually.be.fulfilled;
    await expect(page.waitForXPath(`//p[contains(., 'No orders')]`)).to.eventually.be.fulfilled;
  });

  it('does not get any socket updates while on historical view and an order is created/updated', async () => {
    order = await OrderService.createOrder(createFakeParams(OrderModel.attributes, { clientId: 'order1' }));
    await page.waitFor(1000);
    await expect(page.$eval('p.lead.text-center', el => el.textContent)).to.eventually.be.equal('No orders');
  });

  it('will show the newly created order after clicking on button to show active orders view', async () => {
    await expect(page.$eval('button.float-right', el => el.textContent)).to.eventually.be.equal('View Active Orders');
    await page.click('button.float-right');
    await expect(page.waitForXPath(`//p[contains(., 'Loading...')]`)).to.eventually.be.fulfilled;
    await expect(page.waitForXPath(`//div[contains(., '${order.name}')]`)).to.eventually.be.fulfilled;
  });

  it('when another order is created, it will appear on list due socket subscription', async () => {
    order2 = await OrderService.createOrder(createFakeParams(OrderModel.attributes, { clientId: 'order2' }));
    await expect(page.waitForXPath(`//div[contains(., '${order2.name}')]`)).to.eventually.be.fulfilled;
  });

  it('still shows both orders when filter by "cooking"', async () => {
    await page.click('div.dropdown');
    await expect(page.waitForXPath(`//a[contains(., 'Cooking Now')]`)).to.eventually.be.fulfilled;
    const [button] = await page.$x(`//a[contains(., 'Cooking Now')]`);
    await button.click();
    await page.waitFor(200);
    await expect(page.$$eval('form', nodes => nodes.length)).to.eventually.be.equal(2);
  });

  it('does not show edit buttons while on active page', async () => {
    await expect(page.$$eval('button > .fa-pencil', nodes => nodes.length)).to.eventually.be.equal(0);
  });

  it('shows both of these orders with edit buttons when on history page (2nd tab)', async () => {
    // in 2nd tab, go to history section and lets edit
    await page2.click('button.float-right');
    await expect(page2.waitForXPath(`//p[contains(., 'Loading...')]`)).to.eventually.be.fulfilled;
    await page2.waitFor(1000);
    await expect(page2.$$eval('form', nodes => nodes.length)).to.eventually.be.equal(2);
  });

  it('shows edit buttons for both of these orders (2nd tab)', async () => {
    await expect(page2.$$eval('button > .fa-pencil', nodes => nodes.length)).to.eventually.be.equal(2);
  });

  it('can enter edit mode (can edit: status, destination, name)', async () => {
    await page2.click('button > .fa-pencil');

    await expect(page2.waitFor('select[name=status]')).to.eventually.be.fulfilled;
    await expect(page2.waitFor('input[name=name]')).to.eventually.be.fulfilled;
    await expect(page2.waitFor('input[name=destination]')).to.eventually.be.fulfilled;
  });

  it('has save button disabled when no changes', async () => {
    await expect(page2.$('button[disabled] > .fa-check')).to.eventually.not.be.null;
  });

  it('enables save button once a change is made', async () => {
    const selectHandle = await page2.$('select[name=status]');
    await selectHandle.select(OrderStatus.CANCELLED);
    await expect(page2.$('button:not([disabled]) > .fa-check')).to.eventually.not.be.null;
  });

  it('on save, it has new value', async () => {
    await page2.click('button > .fa-check');
    await page2.waitFor(() => !document.querySelector('select[name=status]'));
    await expect(page2.waitForXPath(`//div[contains(., '${OrderStatus.CANCELLED}')]`)).to.eventually.be.fulfilled;
  });

  it('as the order was cancelled it should have disappeared from active orders page (1st tab) (as it is currently showing "Cooking")', async () => {
    await expect(page.$$eval('form', nodes => nodes.length)).to.eventually.be.equal(1);
  });

  it('keeps just cooked for 2s', async function() {

    // select just cooked 1st tab, should have 0 results
    await page.click('div.dropdown');
    const buttonHandle = await page.waitForXPath(`//a[contains(., 'Just Cooked')]`);
    await buttonHandle.click();

    // set the withinCookedSec to 2
    const cookedWithinSecInput = await page.waitFor('#cooked-within-sec');
    cookedWithinSecInput.press('Backspace');
    cookedWithinSecInput.type('2');

    // set order 1 in 2nd tab to COOKED
    await page2.click('button > .fa-pencil');
    const selectHandle = await page2.waitFor('select[name=status]');
    await selectHandle.select(OrderStatus.COOKED);
    await page2.click('button > .fa-check');

    // it should show on 1st tab
    await expect(page.waitForXPath(`//div[contains(., '${OrderStatus.COOKED}')]`)).to.eventually.be.fulfilled;

    // after 2s it should no longer show
    await page.waitFor(2000);
    await expect(page.$x(`//div[contains(., '${OrderStatus.COOKED}')]`)).to.eventually.be.an('array').that.is.empty;


  });


});

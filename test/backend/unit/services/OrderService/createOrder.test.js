const { spy } = require('sinon');

const cleanDatabase = require('../../../utils/cleanDatabase');
const createFakeParams = require('../../../utils/createFakeParams');

const OrderModel = require('../../../../../api/models/Order');

describe('OrderService', () => {

  describe('#createOrder', () => {

    after(async () => {

      await cleanDatabase();

    });

    it('creates order succesfully', async () => {


      const softOrder = createFakeParams(OrderModel.attributes);

      await expect(OrderService.createOrder(softOrder)).to.eventually.be.fulfilled;

      await expect(Order.find()).to.eventually
        .be.an('array').with.lengthOf(1)
        .that.has.property('0').that.includes(softOrder);

    });

    it('returns order succesfully', async () => {

      const softOrder = createFakeParams(OrderModel.attributes);

      await expect(OrderService.createOrder(softOrder)).to.eventually.be.an('object').that.includes(softOrder);

    });

    it(`broadcasts socket event of "OrderService.SOCKET_EVENT_NAME" on to "OrderService.ACTIVE_ORDERS_ROOM" on create`, async () => {

      const broadcastSpy = spy(sails.sockets, 'broadcast');

      const order = await OrderService.createOrder(createFakeParams(OrderModel.attributes));

      expect(broadcastSpy).to.have.been.calledOnceWith(OrderService.ACTIVE_ORDERS_ROOM, OrderService.SOCKET_EVENT_NAME, order);

      broadcastSpy.restore();

    });

  });

});

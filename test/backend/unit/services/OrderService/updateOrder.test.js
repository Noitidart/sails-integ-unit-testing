const { spy } = require('sinon');

const cleanDatabase = require('../../../utils/cleanDatabase');
const createFake = require('../../../utils/createFake');
const createFakeParams = require('../../../utils/createFakeParams');

const OrderModel = require('../../../../../api/models/Order');

describe('OrderService', () => {

  describe('#updateOrder', () => {

    let order;
    let clientId;

    before(async () => {
      order = await createFake(Order);
      clientId = order.clientId;
    });

    after(async () => {

      await cleanDatabase();

    });

    it('fails if order does not exist', async () => {

      const partialOrder = { clientId: 'fooClientId' };
      await expect(OrderService.updateOrder(partialOrder)).to.eventually.be.rejectedWith('NOT_FOUND');

    });

    it('succesfully updates order', async () => {

      const partialOrder = createFakeParams(OrderModel.attributes, { clientId });

      await expect(OrderService.updateOrder(partialOrder)).to.eventually.be.fulfilled;

      await expect(Order.findOne(order.id)).to.eventually
        .be.an('object').that.includes(partialOrder);

    });

    it('returns order succesfully', async () => {

      const partialOrder = createFakeParams(OrderModel.attributes, { clientId });

      await expect(OrderService.updateOrder(partialOrder)).to.eventually.be.an('object').that.includes(partialOrder);

    });

    it(`broadcasts socket event of "OrderService.SOCKET_EVENT_NAME" on to "OrderService.ACTIVE_ORDERS_ROOM" on create`, async () => {

      const broadcastSpy = spy(sails.sockets, 'broadcast');

      const updatedOrder = await OrderService.updateOrder({ clientId });

      expect(broadcastSpy).to.have.been.calledOnceWith(OrderService.ACTIVE_ORDERS_ROOM, OrderService.SOCKET_EVENT_NAME, updatedOrder);

      broadcastSpy.restore();

    });

  });

});

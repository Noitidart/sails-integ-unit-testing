const { stub } = require('sinon');

const cleanDatabase = require('../../../utils/cleanDatabase');
const createFake = require('../../../utils/createFake');
const socketLib = require('../../../../../lib/sockets');

const { OrderStatus } = require('../../../../../types');

const getRoomsOfSocketStub = stub(socketLib, 'getRoomsOfSocket').callThrough();

describe('OrderService', () => {

  describe('#getOrders', () => {

    // an order for each status
    const orderByStatus = {};

    const RequestMock = { isSocket: false };
    const SocketRequestMock = { isSocket: true };

    let joinStub;
    let leaveStub;

    before(async () => {

      for (const status of Object.keys(OrderStatus)) {
        orderByStatus[status] = await createFake(Order, { Order: { status } });
      }

      joinStub = stub(sails.sockets, 'join').callsArg(2);
      leaveStub = stub(sails.sockets, 'leave').callsArg(2);
      getRoomsOfSocketStub.resolves([]);

    });

    after(async () => {

      await cleanDatabase();

      joinStub.restore();
      leaveStub.restore();
      getRoomsOfSocketStub.restore();

    });

    it('fails if req is not a socket', async () => {
      await expect(OrderService.getOrders(false, RequestMock)).to.eventually.be.rejectedWith('NOT_SOCKET');
    });

    it('returns all in order by createdAt', async () => {
      await expect(OrderService.getOrders(false, SocketRequestMock)).to.eventually
        .have.property('results').that.is.an('array').with.lengthOf(Object.keys(orderByStatus).length)
        .and.have.deep.members(Object.values(orderByStatus))
        .and.to.be.ascendingBy('createdAt');
    });

    it('returns only not delivered, and not cancelled olders when onlyActive is true', async () => {

      const activeOrders = Object.values(orderByStatus).filter(order => ![OrderStatus.DELIVERED, OrderStatus.CANCELLED].includes(order.status))

      await expect(OrderService.getOrders(true, SocketRequestMock)).to.eventually
        .have.property('results').that.is.an('array').with.lengthOf(activeOrders.length)
        .and.have.deep.members(activeOrders)
        .and.to.be.ascendingBy('createdAt');
    });

    it('joins active orders room, when getting active, and was not originally in it', async () => {

      const wantsOnlyActive = true;

      joinStub.resetHistory();
      leaveStub.resetHistory();
      getRoomsOfSocketStub.resolves([]);

      await OrderService.getOrders(wantsOnlyActive, SocketRequestMock);

      expect(leaveStub).to.not.have.been.called;
      expect(joinStub).to.not.have.been.calledOnceWith([SocketRequestMock, OrderService.ACTIVE_ORDERS_ROOM]);

    });

    it('does not join multiple times, when getting active, when was already in it', async () => {
      const wantsOnlyActive = true;

      joinStub.resetHistory();
      leaveStub.resetHistory();
      getRoomsOfSocketStub.resolves([OrderService.ACTIVE_ORDERS_ROOM]);

      await OrderService.getOrders(wantsOnlyActive, SocketRequestMock);

      expect(leaveStub).to.not.have.been.called;
      expect(joinStub).to.not.have.been.called;
    });

    it('leaves active orders room, when getting all, if was originally in it', async () => {
      const wantsOnlyActive = false;

      joinStub.resetHistory();
      leaveStub.resetHistory();
      getRoomsOfSocketStub.resolves([OrderService.ACTIVE_ORDERS_ROOM]);

      await OrderService.getOrders(wantsOnlyActive, SocketRequestMock);

      expect(leaveStub).to.not.have.been.calledOnceWith([SocketRequestMock, OrderService.ACTIVE_ORDERS_ROOM]);
      expect(joinStub).to.not.have.been.called;
    });

    it('does not leave active orders room, when getting all, when was not originally in it', async () => {
      const wantsOnlyActive = false;

      joinStub.resetHistory();
      leaveStub.resetHistory();
      getRoomsOfSocketStub.resolves([]);

      await OrderService.getOrders(wantsOnlyActive, SocketRequestMock);

      expect(leaveStub).to.not.have.been.called;
      expect(joinStub).to.not.have.been.called;
    });

    it('fails if join error happens', async () => {
      joinStub.callsArgWith(2, 'foo error');
      getRoomsOfSocketStub.resolves([]);

      await expect(OrderService.getOrders(true, SocketRequestMock)).to.eventually.be.rejectedWith('SOCKET_JOIN_ERROR');

    });

  });

});

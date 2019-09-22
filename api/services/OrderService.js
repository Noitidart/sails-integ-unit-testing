const fs = require('fs');
const { pick } = require('lodash');

const { getRoomsOfSocket } = require('../../lib/sockets');
const { OrderStatus } = require('../../types');

const OrderService = {

  ACTIVE_ORDERS_ROOM: 'active-orders',

  SOCKET_EVENT_NAME: 'order-created-or-updated',

  broadcastOrder: function(order) {
    sails.sockets.broadcast(this.ACTIVE_ORDERS_ROOM, this.SOCKET_EVENT_NAME, order);
  },

  /**
   *
   * @param {*} softOrder - not-yet created order. meaning no id. status is ignored if present, always created in CREATED status.
   */
  createOrder: async function(softOrder) {
    const order = await Order.create({
      ...pick(softOrder, 'clientId', 'name', 'destination'),
      status: OrderStatus.CREATED
    }).fetch();

    OrderService.broadcastOrder(order);

    return order;
  },

  /**
   * Calls to this must be over socket protocol, because it always does subscribe/unsubscribe
   *
   * @param {boolean} onlyActive
   * @param {Req} req
   */
  getOrders: async function(onlyActive, req) {
    if (!req.isSocket) throw new Error('NOT_SOCKET');

    const where = onlyActive ? { status: { '!=': [OrderStatus.DELIVERED, OrderStatus.CANCELLED] } } : undefined;
    const orders = await Order.find({
      where,
      sort: 'createdAt ASC'
    });

    // check if subscribed to another order- room, if it is, then leave it
    const isInActiveOrdersRoom = (await getRoomsOfSocket(req)).includes(this.ACTIVE_ORDERS_ROOM);
    if (isInActiveOrdersRoom && !onlyActive) {
      await new Promise(resolve => sails.sockets.leave(req, this.ACTIVE_ORDERS_ROOM, resolve));
    } else if (!isInActiveOrdersRoom && onlyActive) {
      const joinErr = await new Promise(resolve => sails.sockets.join(req, this.ACTIVE_ORDERS_ROOM, resolve));
      if (joinErr) throw new Error('SOCKET_JOIN_ERROR');
    }

    return {
      results: orders
    };
  },

  /**
   *
   * @param {*} partialOrder - must have `clientId`, and all other keys optional
   */
  updateOrder: async function(partialOrder) {
    const order = await Order.updateOne({ clientId: partialOrder.clientId }).set({
      ...pick(partialOrder, 'clientId', 'name', 'destination', 'status'),
      ...(partialOrder.status === OrderStatus.COOKED && { cookedAt: Date.now() })
    });

    if (!order) throw new Error('NOT_FOUND');

    OrderService.broadcastOrder(order);

    return order;
  },

  streamFakeOrders: async function() {
    const fakeEventsTxt = await new Promise((resolve, reject) =>
      fs.readFile(__dirname + '/challenge_data.json', 'utf8', (err, data) => (err ? reject(err) : resolve(data)))
    );
    const fakeEvents = JSON.parse(fakeEventsTxt);

    for (const fakeEvent of fakeEvents) {
      const partialOrder = {
        clientId: fakeEvent.id,
        status: fakeEvent.event_name,
        ...pick(fakeEvent, 'destination', 'name')
      };

      setTimeout(() => {
        if (partialOrder.status === OrderStatus.CREATED) {
          OrderService.createOrder(partialOrder);
        } else {
          OrderService.updateOrder(partialOrder);
        }
      }, fakeEvent.sent_at_second * 1000);
    }
  }
};

module.exports = OrderService;

const { pick } = require('lodash');

const { getRoomsOfSocket } = require('../../lib/sockets');

const ACTIVE_ORDERS_ROOM = 'active-orders';

const OrderService = {

  broadcastOrder: function(order) {

    sails.sockets.broadcast(ACTIVE_ORDERS_ROOM, 'order-created-or-updated', order)

  },

  /**
   *
   * @param {*} partialOrder
   * @param {OrderEvent} [orderEvent] - if running due to order event, this will associate it. optional.
   */
  createOrder: async function(partialOrder, orderEvent) {

    const order = await Order.create(
      pick(partialOrder, 'clientId', 'name', 'destination', 'status'),
    ).fetch();

    if (orderEvent) {
      await Order.addToCollection(order.id, 'events', orderEvent.id);
    }

    OrderService.broadcastOrder(order);

  },

  /**
   * Calls to this must be over socket protocol, because it always does subscribe/unsubscribe
   *
   * @param {"all" | "active"} type
   * @param {"all" | "active"} req
   */
  getOrders: async function(type, req) {

    if (!req.isSocket) throw new Error('NOT_SOCKET');

    const where = type === 'active' ? { status: { '!=': ['DELIVERED', 'CANCELLED'] } } : undefined;
    const orders = await Order.find({
      where,
      sort: 'orderNumber ASC',
    }).populate('events', { sort: 'createdAt ASC' });

    // check if subscribed to another order- room, if it is, then leave it
    const isInActiveOrdersRoom = (await getRoomsOfSocket(req)).includes(ACTIVE_ORDERS_ROOM);
    if (isInActiveOrdersRoom && type !== 'active') {
      await new Promise(resolve => sails.sockets.leave(req, ACTIVE_ORDERS_ROOM, resolve))
    } else if (!isInActiveOrdersRoom && type === 'active') {
      const joinErr = await new Promise(resolve => sails.sockets.join(req, ACTIVE_ORDERS_ROOM, resolve));
      if (joinErr) throw new Error('SOCKET_JOIN_ERROR');
    }

    return {
      results: orders
    };
  },

  /**
   *
   * @param {*} partialOrder
   * @param {OrderEvent} [orderEvent] - if running due to order event it will udpate it. optional.
   */
  updateOrder: async function(partialOrder, orderEvent) {


    const order = await Order.updateOne({ clientId: partialOrder.clientId }).set({
      ...pick(partialOrder, 'clientId', 'name', 'destination', 'status'),
      ...partialOrder.status === 'COOKED' && { cookedAt: Date.now() }
    });

    if (!order) throw new Error('NOT_FOUND');

    if (orderEvent) {
      await Order.addToCollection(order.id, 'events', orderEvent.id);
    }

    OrderService.broadcastOrder(order);

    return order;
  }

};

module.exports = OrderService;
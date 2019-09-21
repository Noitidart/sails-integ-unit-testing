const { pick, inRange } = require('lodash');

const { getAllRooms, getRoomsOfSocket } = require('../../lib/sockets');

const ALL_ACTIVE_ORDERS_ROOM = 'active-orders';
const ACTIVE_ORDERS_ROOM_PREFIX = 'active-orders-';

const OrderService = {

  broadcastOrder: function(order, wasJustCreated=false) {

    const broadcast = room => {
      sails.sockets.broadcast(room, wasJustCreated ? 'order-created' : 'order-updated', order)
    };

    const rooms = getAllRooms();
    if (rooms.includes(ALL_ACTIVE_ORDERS_ROOM)) broadcast()

    for (const room of rooms) {
      if (room.startsWith(ACTIVE_ORDERS_ROOM_PREFIX)) {
        const [,,minOrderNumberInc, maxOrderNumberInc] = room.split('-');
        if (inRange(order.orderNumber, minOrderNumberInc, maxOrderNumberInc)) {
          broadcast(room);
        }
      }
    }

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

    OrderService.broadcastOrder(order, true);

  },

  /**
   * Calls to this must be over socket protocol, because it always does subscribe/unsubscribe
   *
   * @param {"all" | "active"} type
   * @param {"all" | "active"} req
   * @param {Object} options
   * @param {number} [options.page] - starts at 1
   * @param {number} [options.size] - if 0/null/undefined, then no pagination happens
   */
  getOrders: async function(
    type,
    req,
    {
      page=1,
      size=0
    }
  ) {

    if (!req.isSocket) throw new Error('NOT_SOCKET');

    if (!size) page = 1;

    const where = type === 'active' ? { status: { '!=': ['DELIVERED', 'CANCELLED'] } } : undefined;
    const orders = await Order.find({
      where,
      sort: 'orderNumber ASC',
      skip: size * (page - 1),
      limit: size
    }).populate('events', { sort: 'createdAt ASC' });

    // check if subscribed to another order- room, if it is, then leave it
    const currentRooms = await getRoomsOfSocket(req);
    const leavePromises = [];
    for (const room of currentRooms) {
      if (room === ALL_ACTIVE_ORDERS_ROOM || room.startsWith(ACTIVE_ORDERS_ROOM_PREFIX)) {
        leavePromises.push(new Promise(resolve => sails.sockets.leave(req, room, resolve)));
      }
    }
    await Promise.all(leavePromises);

    if (type === 'active') {
      // join the order room for this page
      let room;
      if (size) {
        // set min and max order numbers (inclusive) on this room
        const firstOrderNumberOnPage = orders[0] ? orders[0].orderNumber : 0;
        const minOrderNumberInc = firstOrderNumberOnPage;
        const maxOrderNumberInc = minOrderNumberInc + size - 1;
        room = ACTIVE_ORDERS_ROOM_PREFIX + `${minOrderNumberInc}-${maxOrderNumberInc}`;
      } else {
        room = ALL_ACTIVE_ORDERS_ROOM;
      }

      console.log('joining room:', room);
      const joinErr = await new Promise(resolve => sails.sockets.join(req, room, resolve));
      if (joinErr) throw new Error('SOCKET_JOIN_ERROR');
    }

    return {
      page,
      size,
      results: orders,
      total: await Order.count(where)
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
      ...partialOrder.eventName === 'COOKED' && { cookedAt: Date.now() }
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
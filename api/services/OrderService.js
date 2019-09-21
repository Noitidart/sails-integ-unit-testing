const { pick } = require('lodash');

const OrderService = {

  broadcastOrder: function() {},

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
   *
   * @param {"all" | "active"} type
   * @param {number} [page] - starts at 1
   * @param {number} [size] - if 0/null/undefined, then no pagination happens
   */
  getOrders: async function(
    type,
    {
      page=1,
      size=0
    }
  ) {

    if (!size) page = 1;
    const firstIndex = size * (page - 1);

    const where = type === 'active' ? { status: { '!=': ['DELIVERED', 'CANCELLED'] } } : undefined;
    const orders = await Order.find({
      where,
      sort: 'createdAt ASC',
      skip: firstIndex,
      limit: size
    }).populate('events', { sort: 'createdAt ASC' });

    // check if subscribed to another order- room, if it is, then leave it

    if (type === 'active') {
      // join the order room for this page
      let room;
      if (size) {
        // set min and max order numbers (inclusive) on this room
        const minOrderNumberInc = firstIndex;
        const maxOrderNumberInc = minOrderNumberInc + size - 1;
        room = `active-orders-${minOrderNumberInc}-${maxOrderNumberInc}`;
      } else {
        room = 'active-orders';
      }

      // TODO: join
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
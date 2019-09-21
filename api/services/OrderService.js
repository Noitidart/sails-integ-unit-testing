const { pick } = require('lodash');

const OrderService = {

  broadcastOrder: function() {},

  createOrder: async function(orderEvent) {

    const order = await Order.create({
      ...pick(orderEvent, 'clientId', 'name', 'destination'),
      status: orderEvent.eventName
    }).fetch();

    await Order.addToCollection(order.id, 'events', orderEvent.id);

    OrderService.broadcastOrder(order);

  },

  getOrders: function() {},

  updateOrder: async function(orderEvent) {

    const order = await Order.updateOne({ clientId: orderEvent.clientId }).set({
      ...pick(orderEvent, 'clientId', 'name', 'destination'),
      status: orderEvent.eventName,
      ...orderEvent.eventName === 'COOKED' && { cookedAt: Date.now() }
    });

    await Order.addToCollection(order.id, 'events', orderEvent.id);

    OrderService.broadcastOrder(order);

  }

};

module.exports = OrderService;
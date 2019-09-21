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

  updateOrder: function() {}

};

module.exports = OrderService;
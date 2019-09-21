const fs = require('fs');

const OrderEventService = {

  createOrderEvent: async function({
    id: clientId,
    destination,
    name,
    event_name: eventName
  }) {

    const formattedEvent = {
      clientId,
      destination,
      name,
      eventName
    };

    const orderEvent = await OrderEvent.create(formattedEvent).fetch();

    if (eventName === 'CREATED') {
      OrderService.createOrder(orderEvent.id, formattedEvent);
    } else {
      OrderService.updateOrder(orderEvent.id, formattedEvent);
    }

  },

  streamFakeEvents: async function() {
    const fakeEventsTxt = await new Promise((resolve, reject) =>
      fs.readFile(__dirname + '/challenge_data.json', 'utf8', (err, data) => (err ? reject(err) : resolve(data)))
    );
    const fakeEvents = JSON.parse(fakeEventsTxt);

    for (const fakeEvent of fakeEvents) {
      setTimeout(() => this.createOrderEvent(fakeEvent), fakeEvent.sent_at_second * 1000);
    }
  }
};

module.exports = OrderEventService;

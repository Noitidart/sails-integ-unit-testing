const fs = require('fs');
const { pick } = require('lodash');

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

    const partialOrder = pick(orderEvent, 'clientId', 'destination', 'name');
    partialOrder.status = eventName;
    if (eventName === 'CREATED') {
      OrderService.createOrder(partialOrder, orderEvent);
    } else {
      OrderService.updateOrder(partialOrder, orderEvent);
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

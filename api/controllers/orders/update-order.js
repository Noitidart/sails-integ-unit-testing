const { OrderStatus } = require('../../../types');

module.exports = {


  friendlyName: 'Update order: eventName, name, destination.',


  description: '',


  inputs: {
    clientId: {
      type: 'string',
      required: true,
    },
    status: {
      type: 'string',
      isIn: Object.keys(OrderStatus),
    },
    name: {
      type: 'string'
    },
    destination: {
      type: 'string'
    },
  },


  exits: {
    success: {
      statusCode: 201
    },
    notFound: {
      statusCode: 404
    }
  },


  fn: async function (inputs, exits) {

    try {
      return exits.success(await OrderService.updateOrder(inputs));
    } catch(err) {
      if (err.message === 'NOT_FOUND') return exits.notFound();
      throw err;
    }

  }


};

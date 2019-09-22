const { pick } = require('lodash');

module.exports = {


  friendlyName: 'Subscribe get orders',


  description: '',


  inputs: {
    onlyActive: {
      type: 'boolean',
      required: true
    }
  },


  exits: {
    success: {
      statusCode: 200
    },
    notSocket: {
      statusCode: 400
    }
  },


  fn: async function (inputs, exits) {

    try {
      return exits.success(await OrderService.getOrders(inputs.onlyActive, this.req));
    } catch(err) {
      if (err.message === 'NOT_SOCKET') return exits.notSocket();
      throw err;
    }

  }


};

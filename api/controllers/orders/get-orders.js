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
    },
    failedJoin: {
      statusCode: 500
    }

  },


  fn: async function (inputs, exits) {

    try {
      return exits.success(await OrderService.getOrders(inputs.onlyActive, this.req));
    } catch(err) {
      if (err.message === 'NOT_SOCKET') return exits.notSocket();
      if (err.message === 'SOCKET_JOIN_ERROR') return exits.failedJoin();
      throw err;
    }

  }


};

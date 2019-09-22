const { pick } = require('lodash');

module.exports = {


  friendlyName: 'Subscribe get orders',


  description: '',


  inputs: {
    type: {
      type: 'string',
      required: true,
      isIn: ['all', 'active']
    }
  },


  exits: {
    success: {
      statusCode: 200
    }
  },


  fn: async function (inputs, exits) {

    return exits.success(await OrderService.getOrders(inputs.type, this.req));

  }


};

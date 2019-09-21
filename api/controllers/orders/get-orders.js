const { pick } = require('lodash');

module.exports = {


  friendlyName: 'Subscribe get orders',


  description: '',


  inputs: {
    page: {
      type: 'number',
      required: true,
      min: 1
    },
    size: {
      type: 'number',
      defaultsTo: 0
    },
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

    return exits.success(await OrderService.getOrders(inputs.type, pick(inputs, 'page', 'size')));

  }


};

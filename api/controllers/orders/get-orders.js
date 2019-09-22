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
    }
  },


  fn: async function (inputs, exits) {

    return exits.success(await OrderService.getOrders(inputs.onlyActive, this.req));

  }


};

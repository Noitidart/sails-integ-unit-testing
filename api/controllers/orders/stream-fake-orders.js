module.exports = {


  friendlyName: 'Stream fake events',


  description: '',


  inputs: {

  },


  exits: {
    success: {
      statusCode: 204
    }
  },


  fn: async function (_inputs, exits) {

    OrderService.streamFakeOrders();

    global.isStreamingTestData = true;

    return exits.success();

  }


};

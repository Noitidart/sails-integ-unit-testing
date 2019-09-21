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


  fn: async function (inputs, exits) {

    try {
      await OrderEventService.streamFakeEvents();
    } catch(err) {
      sails.log.error(`Failed to start streaming fake events, error: ` + err.message);
      throw err;
    }

    global.isStreamingTestData = true;

    return exits.success();

  }


};

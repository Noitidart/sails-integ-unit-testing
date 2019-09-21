module.exports = {


  friendlyName: 'Create order event',


  description: '',


  inputs: {
    destination: {
      type: 'string',
      required: true
    },

    event_name: {
      type: 'string',
      required: true,
      isIn: ['CREATED', 'COOKED', 'CANCELLED', 'DRIVER_RECEIVED', 'DELIVERED'],
    },

    id: {
      type: 'string',
      required: true
    },

    name: {
      type: 'string',
      required: true
    },

  },


  exits: {
    success: {
      statusCode: 204
    }
  },


  fn: async function (inputs, exits) {

    await OrderEventService.createOrderEvent(inputs);

    return exits.success();

  }


};

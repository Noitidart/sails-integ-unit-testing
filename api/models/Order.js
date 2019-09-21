/**
 * Order.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

    name: {
      type: 'string',
      required: true
    },

    clientId: {
      type: 'string',
      required: true,
      unique: true
    },

    status: {
      type: 'string',
      required: true,
      isIn: ['CREATED', 'COOKED', 'CANCELLED', 'DRIVER_RECEIVED', 'DELIVERED'],
    },

    destination: {
      type: 'string',
      required: true
    },

    orderNumber: {
      type: 'number',
      // sails-notes: cannot be required if its autoIncrement: true
      // required: true,
      autoIncrement: true
    },

    cookedAt: {
      type: 'number',
      description: 'The most recent time at which the status was set to "COOKED"'
    },


    //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
    //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
    //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝


    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝

    // One way association - meaning there is no attribute on OrderEvent (ie: OrderEvent.order)
    // Order.events one-or-many to one with OrderEvent (unfortunately even though i want one-or-many, this is zero-or-many because at creation time I can't pass in OrderEvent.id i have to do addToCollection)
    // Order.hasMany(OrderEvent) - OrderEvent.belongsTo(Order)
    events: {
      collection: 'orderevent',
    },

  },

};

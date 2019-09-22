const supertestWithCsrf = require('../../../utils/supertestWithCsrf');
const cleanDatabase = require('../../../utils/cleanDatabase');
const createFake = require('../../../utils/createFake');

const { OrderStatus } = require('../../../../../types');

describe('OrderController', () => {

  describe('#getOrders', () => {

    after(async () => {

      await cleanDatabase();

    });

    it('fails if not a socket request', async () => {

      await supertestWithCsrf.get(sails.getUrlFor('orders/get-orders'))
        .query({
          onlyActive: false
        })
        .expect(400);

    });

    it('success if it is a socket request', async () => {

      await expect(new Promise(resolve => io.socket.get(sails.getUrlFor('orders/get-orders') + '?onlyActive=false', (_, jwres) => resolve(jwres))))
        .to.eventually.not.have.property('statusCode', 400);

    });

    it('gets empty array when no ordes exist for type onlyActive=false', async () => {

      await expect(new Promise(resolve => io.socket.get(sails.getUrlFor('orders/get-orders') + '?onlyActive=false', (_, jwres) => resolve(jwres))))
        .to.eventually.nested.include({ statusCode: 200 })
        .and.to.have.nested.property('body.results').that.is.an('array').that.is.empty;

    });

    it('finds all orders', async () => {

      const order = await createFake(Order);

      await expect(new Promise(resolve => io.socket.get(sails.getUrlFor('orders/get-orders') + '?onlyActive=false', (_, jwres) => resolve(jwres))))
        .to.eventually.nested.include({
          statusCode: 200,
          'body.results[0].id': order.id
        })
        .and.to.have.nested.property('body').to.be.jsonSchema({
          definitions: {},
          $schema: 'http://json-schema.org/draft-07/schema#',
          $id: 'http://example.com/root.json',
          type: 'object',
          title: 'The Root Schema',
          required: ['results'],
          properties: {
            results: {
              $id: '#/properties/results',
              type: 'array',
              title: 'The Results Schema',
              items: {
                $id: '#/properties/results/items',
                type: 'object',
                title: 'The Items Schema',
                required: [
                  'createdAt',
                  'updatedAt',
                  'id',
                  'name',
                  'clientId',
                  'status',
                  'destination',
                  'cookedAt'
                ],
                properties: {
                  createdAt: {
                    $id: '#/properties/results/items/properties/createdAt',
                    type: 'integer',
                    title: 'The Createdat Schema',
                    default: 0,
                    examples: [1569159356101]
                  },
                  updatedAt: {
                    $id: '#/properties/results/items/properties/updatedAt',
                    type: 'integer',
                    title: 'The Updatedat Schema',
                    default: 0,
                    examples: [1569159356101]
                  },
                  id: {
                    $id: '#/properties/results/items/properties/id',
                    type: 'string',
                    title: 'The Id Schema',
                    default: '',
                    examples: ['5d8778bc65721d1f39635c00'],
                    pattern: '^(.*)$'
                  },
                  name: {
                    $id: '#/properties/results/items/properties/name',
                    type: 'string',
                    title: 'The Name Schema',
                    default: '',
                    examples: ['array'],
                    pattern: '^(.*)$'
                  },
                  clientId: {
                    $id: '#/properties/results/items/properties/clientId',
                    type: 'string',
                    title: 'The Clientid Schema',
                    default: '',
                    examples: ['Toys'],
                    pattern: '^(.*)$'
                  },
                  status: {
                    $id: '#/properties/results/items/properties/status',
                    type: 'string',
                    title: 'The Status Schema',
                    default: '',
                    examples: ['DRIVER_RECEIVED'],
                    pattern: '^(.*)$'
                  },
                  destination: {
                    $id: '#/properties/results/items/properties/destination',
                    type: 'string',
                    title: 'The Destination Schema',
                    default: '',
                    examples: ['Interactions'],
                    pattern: '^(.*)$'
                  },
                  cookedAt: {
                    $id: '#/properties/results/items/properties/cookedAt',
                    type: 'integer',
                    title: 'The Cookedat Schema',
                    default: 0,
                    examples: [0]
                  }
                }
              }
            }
          }
        })
        .and.to.have.property('results').that.is.an('array').with.lengthOf(1);

    });

    it('does not return inative orders if onlyActive=true', async () => {

      await createFake(Order, {
        Order: {
          status: OrderStatus.CANCELLED
        }
      });

      await expect(new Promise(resolve => io.socket.get(sails.getUrlFor('orders/get-orders') + '?onlyActive=true', (_, jwres) => resolve(jwres))))
        .to.eventually.nested.include({
          statusCode: 200,
        })
        .and.to.have.nested.property('body.results').that.is.an('array').that.is.empty;

    });


  });

});

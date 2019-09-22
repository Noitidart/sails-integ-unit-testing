const createFakeParams = require('../../../utils/createFakeParams');
const cleanDatabase = require('../../../utils/cleanDatabase');
const createFake = require('../../../utils/createFake');
const supertestWithCsrf = require('../../../utils/supertestWithCsrf');

const updateOrderAction = require('../../../../../api/controllers/orders/update-order');

describe('OrderController', () => {

  describe('#updateOrder', () => {

    let order;

    before(async () => {

      order = await createFake(Order);

    });

    after(async () => {

      await supertestWithCsrf.post(sails.getUrlFor('account/logout')).expect(200).expect('OK');
      await cleanDatabase();

    });

    it('does not get unauthorized if user is not logged in', async () => {

      await supertestWithCsrf.patch(sails.getUrlFor('orders/update-order').replace(':clientId', 'fooClientId'))
        .expect(res => {
          if (res.status === 401) throw new Error(`Expected non-401 response`);
        });

    });

    it('gets 404 when does not own a order does not exist', async () => {

      await supertestWithCsrf.patch(sails.getUrlFor('orders/update-order').replace(':clientId', 'fooClientId'))
        .send(createFakeParams(updateOrderAction.inputs))
        .expect(404);

    });

    it('succeeds if order exists', async () => {

      await supertestWithCsrf.patch(sails.getUrlFor('orders/update-order').replace(':clientId', order.clientId))
        .send(createFakeParams(updateOrderAction.inputs))
        .expect(201)
        .expect(res =>
          expect(res.body).to.be.jsonSchema({
            definitions: {},
            $schema: 'http://json-schema.org/draft-07/schema#',
            $id: 'http://example.com/root.json',
            type: 'object',
            title: 'The Root Schema',
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
                $id: '#/properties/createdAt',
                type: 'integer',
                title: 'The Createdat Schema',
                default: 0,
                examples: [1569157598820]
              },
              updatedAt: {
                $id: '#/properties/updatedAt',
                type: 'integer',
                title: 'The Updatedat Schema',
                default: 0,
                examples: [1569157598846]
              },
              id: {
                $id: '#/properties/id',
                type: 'string',
                title: 'The Id Schema',
                default: '',
                examples: ['5d8771ded295de1c2aba0ef0'],
                pattern: '^(.*)$'
              },
              name: {
                $id: '#/properties/name',
                type: 'string',
                title: 'The Name Schema',
                default: '',
                examples: ['East Caribbean Dollar'],
                pattern: '^(.*)$'
              },
              clientId: {
                $id: '#/properties/clientId',
                type: 'string',
                title: 'The Clientid Schema',
                default: '',
                examples: ['Unbranded'],
                pattern: '^(.*)$'
              },
              status: {
                $id: '#/properties/status',
                type: 'string',
                title: 'The Status Schema',
                default: '',
                examples: ['DRIVER_RECEIVED'],
                pattern: '^(.*)$'
              },
              destination: {
                $id: '#/properties/destination',
                type: 'string',
                title: 'The Destination Schema',
                default: '',
                examples: ['initiative'],
                pattern: '^(.*)$'
              },
              cookedAt: {
                $id: '#/properties/cookedAt',
                type: 'integer',
                title: 'The Cookedat Schema',
                default: 0,
                examples: [0]
              }
            }
          })
        );

    });

  });

});

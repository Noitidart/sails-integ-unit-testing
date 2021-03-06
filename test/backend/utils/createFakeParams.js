const faker = require('faker');

/**
 * Does not create entities, just populates with random params
 *
 */
function createFakeParams(inputs, overwrite={}) {

    const params = {};

    for (const [name, desc] of Object.entries(inputs)) {

        if (desc.required) {

            const value = (() => {
                if (desc.isIn)
                    return () => faker.random.arrayElement(desc.isIn);
                else if (desc.isEmail)
                    return faker.internet.email;
                else if (['number', 'boolean'].includes(desc.type))
                    return faker.random[desc.type];
                else if (desc.type === 'string')
                    return faker.random.word;
            })()();

            params[name] = value;

        }

    }

    return { ...params, ...overwrite };
}

module.exports = createFakeParams;
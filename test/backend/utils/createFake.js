const path = require('path');
const fs = require('fs');
const faker = require('faker');
const moment = require('moment');
const { attempt, get, isString, last, take } = require('lodash');

const MODEL_NAMES = fs.readdirSync(path.join('api', 'models')).map(modelModuleFilename => modelModuleFilename.substring(0, modelModuleFilename.lastIndexOf('.')));

const modelModuleByModelName = MODEL_NAMES.reduce((acc, modelName) =>
  Object.assign(
    acc,
    { [modelName]: require('../../../api/models/' + modelName) }
  ),
  {}
);

/**
 *
 * @param {*} model
 * @param {Object} prefills - if a value is a string that starts with \ then it is a path to previously created
 * {
 *   Affair: {
 *     timeDesc: undefined
 *   }
 *   Company: {
 *     owner: '\Affair.author'
 *   }
 *
 * }
 */
async function createFake(model, prefills = {}) {

  const customizers = {
    User: {
      password: async function customizeUserPassword(val, isIn) {
        if (isIn) {
          customizeUserPassword.origVal = val;
          return await sails.helpers.passwords.hashPassword(val);
        } else {
          return customizeUserPassword.origVal;
        }
      },
      emailAddress: async (val, isIn) => {
        if (isIn) {
          return val.toLowerCase();
        } else {
          return val;
        }
      }
    }
  };

  const modelByModelName = MODEL_NAMES.reduce((acc, modelName) =>
    Object.assign(
      acc,
      { [modelName]: global[modelName] }
    ),
    {}
  );

  const [modelName] = Object.entries(modelByModelName).find(([, aModel]) => aModel === model);
  const modelModule = modelModuleByModelName[modelName];
  if (!modelModule) throw new Error(`Module not found for model with name "${modelName}".`);

  // console.log(`Start prepping data to create fake "${modelName}"`);

  const { attributes: attrMetaByAttrName } = modelModule;

  const createData = {};

  for (const [name, meta] of Object.entries(attrMetaByAttrName)) {

    const path = [modelName, name];

    if (meta.required || hasPath(prefills, path)) {

      const value = await (async () => {


        if (hasPath(prefills, path)) {

          // console.log(`Prefill input provided for "${modelName}.${name}"`);
          const valueOrBacktrackPath = get(prefills, path);

          if (isString(valueOrBacktrackPath) && valueOrBacktrackPath.startsWith('\\')) {
            // console.log(`Backtrack prefill input provided for "${modelName}.${name}"`);
            const backtrackPath = valueOrBacktrackPath.substr(1);
            if (hasPath(prefills, backtrackPath)) {
              const value = get(prefills, backtrackPath);
              return value;
            } else {
              throw new Error(`You wanted to populate the fake "${modelName}"'s attribute of "${name}" with backtrack path of "${backtrackPath}", however this backtracked path does not yet exist.`);
            }
          } else {
            const value = valueOrBacktrackPath;
            return value;
          }

        } else {

          const modelNameOfUnkCase = meta.model || meta.collection;

          if (modelNameOfUnkCase) {

            // console.log(`Need to first recursively create fake "${modelNameOfUnkCase}" in order to set "${modelName}.${name}"`);
            const [, model] = Object.entries(modelByModelName).find(([aModelName]) => aModelName.toLowerCase() === modelNameOfUnkCase.toLowerCase());
            return (await createFake(model, prefills)).id;

          } else {

            if (meta.isIn)
              return faker.random.arrayElement(meta.isIn);

            // console.log(`Using faker to set "${modelName}.${name}"`);
            const maybeUnique = meta.unique ? faker.unique : attempt;

            const fakerGenerator = (() => {
              if (meta.isEmail)
                return faker.internet.email;
              else if (['number', 'boolean'].includes(meta.type))
                return faker.random[meta.type];
              else if (meta.type === 'string')
                return faker.random.word;
            })();

            return maybeUnique(fakerGenerator);
          }

        }

      })();

      // console.log(`Setting "${modelName}.${name}" to "${value}"`);
      const customize = get(customizers, [modelName, name]);
      createData[name] = customize ? await customize(value, true) : value;

    }
  }

  // console.log(`Creating "${modelName}" with data:`, createData);
  const fetched = await model.create(createData).fetch();

  for (const [key, val] of Object.entries(fetched)) {
    const customize = get(customizers, [modelName, key]);
    fetched[key] = customize ? await customize(val, false) : val;
  }

  return fetched;
}

/**
 * Tells if the path exists. I have to use this because if value of path is "undefined"
 * lodash `get` will falsely report it does not exist.
 *
 * @param {same as lodash.get object arg (1st arg)} obj
 * @param {same as lodash.get path arg (2nd arg)} path
 *
 * @returns {boolean}
 */
function hasPath(obj, path) {
  const pathArr = isString(path) ? path.split('.') : path;

  if (pathArr.length === 1) {
    return obj.hasOwnProperty(path[0]);
  } else {
    const notFound = Symbol('notFound');
    const targetParent = get(obj, take(pathArr, pathArr.length - 1), notFound);
    return targetParent === notFound ? false : targetParent.hasOwnProperty(last(pathArr));
  }

}

module.exports = createFake;

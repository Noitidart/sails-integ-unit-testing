// https://github.com/sindresorhus/globals/issues/62#issuecomment-160306755

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const chaiSinon = require('sinon-chai');
const chaiSorted = require('chai-sorted');
const chaiJsonSchema = require('chai-json-schema');

chai.use(chaiJsonSchema);
chai.use(chaiSorted);
chai.use(chaiSinon);
// Must install Chai as Promised last - https://github.com/domenic/chai-as-promised/#node
chai.use(chaiAsPromised);

// Disable object truncating - https://stackoverflow.com/a/23378037/1828637
chai.config.truncateThreshold = 0;

global.expect = chai.expect;

const { stub } = require('sinon');

/**
 * "perm stub" always call through. It is just a stub that allows me to control
 * the function body of it when needed.
 *
 * @param {string} modulePath
 */
function permStubDefaultExport(modulePath) {
  require(modulePath);

  let stubbed;
  try {
    stubbed = stub(require.cache[require.resolve(modulePath)], 'exports');
    stubbed.callThrough();

    stubbed.resetPermStub = () => {
      stubbed.reset();
      stubbed.callThrough();
    };
  } catch(ignore) {
    // it is already stubbed
    stubbed = require.cache[require.resolve(modulePath)].exports;
  }

  return stubbed;
}

module.exports = permStubDefaultExport;

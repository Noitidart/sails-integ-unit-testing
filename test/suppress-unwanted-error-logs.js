const { stub } = require('sinon');
const original = global.console.error;
stub(global.console, 'error').callsFake(e => {
  if (!e.startsWith('Error: Uncaught') && !e.includes('https://fb.me/react-error-boundaries')) {
    original(e);
  }
});

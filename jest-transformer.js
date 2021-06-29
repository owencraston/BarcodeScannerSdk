// Thist configures Jest to tell Babel to find its configuration upwards.
// In our case, we'd like to read it from the root.
module.exports = require('babel-jest').createTransformer({
  rootMode: 'upward',
});

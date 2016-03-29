'use strict';

var _ = require('lodash');

module.exports.deepClone = function(value) {
  if (_.isUndefined(value)) {
    return value;
  }
  return JSON.parse(JSON.stringify(value));
};

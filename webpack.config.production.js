'use strict';

var _ = require('lodash');
var webpack = require('webpack');
var baseConfig = require('./webpack.config.base');

var productionConfig = {
  output: {
    filename: 'babbage-[name].min.js'
  },
  plugins:  [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        // jscs:disable
        screw_ie8: true,
        // jscs:enable
        warnings: false
      }
    })
  ]
};

var config = _.merge({}, baseConfig, productionConfig);

module.exports = config;

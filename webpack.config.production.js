'use strict'

var _ = require('lodash')
var webpack = require('webpack')
var baseConfig = require('./webpack.config.base')

var buildTarget = process.env.BUILD_TARGET || '';
var targetFileName = 'babbage.min.js';
if (buildTarget) {
  targetFileName = 'babbage-' + buildTarget + '.min.js';
}

var productionConfig = {
  output: {
    filename: targetFileName,
    path: './dist'
  },
  externals: {
    // require("jquery") is external and available
    // on the global var jQuery
    'jquery': 'jQuery'
  },
  plugins:  [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        screw_ie8: true,
        warnings: false
      }
    })
  ]
}

var config = _.merge({}, baseConfig, productionConfig)

module.exports = config

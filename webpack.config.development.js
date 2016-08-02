'use strict'

var _ = require('lodash')
var webpack = require('webpack')
var baseConfig = require('./webpack.config.base')

var buildTarget = process.env.BUILD_TARGET || '';
var targetFileName = 'babbage.js';
if (buildTarget) {
  targetFileName = 'babbage-' + buildTarget + '.js';
}

var developmentConfig = {
  output: {
    filename: targetFileName,
    path: './dist'
  },
  plugins:  [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development')
    })
  ]
}

var config = _.merge({}, baseConfig, developmentConfig)

module.exports = config

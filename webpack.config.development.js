'use strict'

var _ = require('underscore')
var webpack = require('webpack')
var baseConfig = require('./webpack.config.base')

var developmentConfig = {
  output: {
    filename: 'babbage.js',
    path: './dist'
  },
  plugins:  [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development')
    })
  ]
}

var config = _.extend({}, baseConfig, developmentConfig)

module.exports = config

'use strict'

var _ = require('lodash')
var webpack = require('webpack')
var baseConfig = require('./webpack.config.base')

var developmentConfig = {
  output: {
    filename: 'babbage.js',
    path: './dist'
  },
  externals: {
    // require("jquery") is external and available
    //  on the global var jQuery
    "jquery": "jQuery"
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

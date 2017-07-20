'use strict';

var fs = require('fs');
var path = require('path');
var _ = require('lodash');

module.exports = {
  entry:  _.chain(fs.readdirSync('./src/bindings'))
    .map(function(item) {
      var ext = item == 'vuejs' ? '.vue' : '.js';
      return [item, './src/bindings/' + item + '/index' + ext];
    })
    .fromPairs()
    .value(),
  output: {
    path: './dist',
    library: 'Babbage',
    libraryTarget: 'umd'
  },
  devtool: 'source-map',
  resolve: {
    fallback: path.join(__dirname, 'node_modules'),
  },
  externals: {
    // require("jquery") is external and available
    // on the global var jQuery
    'jquery': 'jQuery',
    // same d3 and c3
    'd3': 'd3',
    'c3': 'c3'
  },
  module: {
    loaders: [
      { test: /\.vue$/, loader: 'vue' },
      { test: /\.js$/, loaders: [ 'babel-loader' ], exclude: /node_modules/ },
      { test: /\.html$/, loader: 'raw' }
    ]
  }
};

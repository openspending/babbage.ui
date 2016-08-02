'use strict'

var buildTarget = process.env.BUILD_TARGET || '';

var targetPath = './src/index.js';
if (buildTarget) {
  var ext = '.js';
  if (buildTarget == 'vuejs') {
    ext = '.vue';
  }
  targetPath = './src/bindings/' + buildTarget + '/index' + ext;
}

module.exports = {
  entry:  targetPath,
  devtool: 'source-map',
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
  },
  output: { library: 'Babbage', libraryTarget: 'umd' }
}

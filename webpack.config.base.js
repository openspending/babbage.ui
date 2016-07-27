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
  module: {
    loaders: [
      { test: /\.vue$/, loader: 'vue' },
      { test: /\.js$/, loaders: [ 'babel-loader' ], exclude: /node_modules/ },
      { test: /\.html$/, loader: 'raw' }
    ]
  },
  output: { library: 'Babbage', libraryTarget: 'umd' }
}

'use strict'

var buildTarget = process.env.BUILD_TARGET || '';

var targetPath = './src/index.js';
if (buildTarget) {
  targetPath = './src/bindings/' + buildTarget + '/index.js';
}

module.exports = {
  entry:  targetPath,
  devtool: 'source-map',
  module: {
    loaders: [
      { test: /\.js$/, loaders: [ 'babel-loader' ], exclude: /node_modules/ },
      { test: /\.html$/, loader: 'raw' }
    ]
  },
  output: { library: 'Babbage', libraryTarget: 'umd' }
}

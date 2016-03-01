'use strict'

module.exports = {
  entry:  './src/index.js',
  devtool: 'source-map',
  module: {
    loaders: [
      { test: /\.js$/, loaders: [ 'babel-loader' ], exclude: /node_modules/ },
      { test: /\.html$/, loader: 'raw' }
    ]
  },
  output: { library: 'Babbage', libraryTarget: 'umd' }
}

'use strict'

module.exports = {
  entry:  './src/app.js',
  devtool: 'source-map',
  module: {
    loaders: [
      { test: /\.js$/, loaders: [ 'babel-loader' ], exclude: /node_modules/ }
    ]
  },
  output: { library: 'Babbage', libraryTarget: 'umd' }
}

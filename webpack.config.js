const path = require('path');

module.exports = {
  entry: './src/index.ts',
  output: {
    filename: 'keyfinder.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: "umd",
    library: "KeyFinder"
  },
  devtool: 'source-map',
  module: {
    loaders: [
      {
        test: /\.ts$/,
        loader: ['ts-loader'],
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js', '.json']
  }
};
const config = {
  context: __dirname + '/app',
  entry: './entry',
  mode: 'none',
  output: {
    path: __dirname + '/public/javascripts',
    filename: 'bundle.js'
  },
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env']
        }
      }
    }]
  },
  externals: [
    {
      jquery: 'jQuery',
    }
  ]
};

module.exports = (env, argv) => {
  // https://webpack.js.org/configuration/mode/
  if (argv.mode === 'development') {
    config.devtool = 'eval-source-map';
  }
  return config;
}
/* eslint-disable strict, import/no-extraneous-dependencies */
'use strict';

const webpack = require('webpack');
const path = require('path');
const DashboardPlugin = require('webpack-dashboard/plugin');
const ExtractTextPlugin = require("extract-text-webpack-plugin");

const nodeEnv = process.env.NODE_ENV || 'development';

let plugins = [
  new webpack.ProvidePlugin({
    $: 'jquery',
    jQuery: 'jquery',
    'window.$': 'jquery',
    'window.jQuery': 'jquery',
    Hammer: 'hammerjs',
  }),
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify(nodeEnv),
    },
  }),
  new ExtractTextPlugin("styles.css")
];

if (process.env.NODE_ENV === 'production') {
  plugins = plugins.concat(
    new webpack.optimize.UglifyJsPlugin({
      compress: { warnings: false },
      comments: false,
      sourceMap: false,
      mangle: true,
      minimize: true,
    })
  );
} else {
  plugins = plugins.concat([
    function watchTimestamp() {
      this.plugin('watch-run', (watching, callback) => {
        /* eslint-disable no-console */
        console.log(`Begin compile at ${new Date()}`);
        callback();
      });
    },
    new DashboardPlugin(),
  ]);
}

let dynamicLoader;

if (process.env.NODE_ENV === 'production') {
  dynamicLoader = [
    {
      test: /\.(js|jsx)$/,
      exclude: /node_modules/,
      loader: 'babel-loader',
    },
    {
      test: /\.css$/,
      loader: 'style-loader!css-loader',
    },
    {
      test: /\.less$/, loader: "style!css!less" },
    {
      test: /\.(ttf|otf|eot|svg|woff(2)?)(\?[a-z0-9]+)?$/,
      loader: 'file-loader?name=fonts/[name].[hash].[ext]',
    },
    {
      test: /\.(jpeg|jpg|png|gif|svg)$/i,
      loaders: [
        'file?hash=sha512&digest=hex&name=[hash].[ext]',
        'image-webpack?{optimizationLevel: 7, interlaced: false, pngquant:{quality: "65-90", speed: 4}, mozjpeg: {quality: 65}}'
      ],
    },
    {
      test: /\.js$/, 
      loader: "webpack-strip?strip[]=debug,strip[]=console.log" 
    },
    { 
      test: /\.json$/,
      loader: 'json'
    }
  ];
} else {
  dynamicLoader = [
    {
      test: /\.(js|jsx)$/,
      exclude: /node_modules/,
      loader: 'babel-loader',
    },
    {
      test: /\.css$/,
      loader: 'style-loader!css-loader',
    },
    { test: /\.less$/, loader: "style!css!less" },
    {
      test: /\.(ttf|otf|eot|svg|woff(2)?)(\?[a-z0-9]+)?$/,
      loader: 'file-loader?name=font/[name].[hash].[ext]',
    },
    {
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'eslint-loader'
    },
    {
      test: /\.(jpeg|jpg|png|gif|svg)$/i,
      loaders: [
        'file?hash=sha512&digest=hex&name=[hash].[ext]',
        'image-webpack?{optimizationLevel: 7, interlaced: false, pngquant:{quality: "65-90", speed: 4}, mozjpeg: {quality: 65}}',
      ],
    },
    { 
      test: /\.json$/,
      loader: 'json'
    }
  ];
}

module.exports = {
  devtool: 'source-map',
  entry: {
    index: ['./src/index.jsx'],
  },
  output: {
    path: path.join(__dirname, 'dist'),
    publicPath: 'dist/',
    filename: 'js/[name].bundle.js',
  },
  contentBase: '.',
  resolve: {
    extensions: ['', '.js', '.jsx'],
  },
  module: {
    loaders: dynamicLoader,
  },
  devServer: {
    colors: true,
    historyApiFallback: true
  },
  plugins,
};

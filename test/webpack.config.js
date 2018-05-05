'use strict'

const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = function (basedir, isFast) {
  return {
    devtool: false,
    mode: 'development',
    entry: {
      'index': path.join(basedir, 'src/index.css')
    },
    output: {
      publicPath: './',
      path: path.join(basedir, isFast ? 'actual' : 'expect'),
      filename: '[name].js'
    },
    module: {
      rules: [
        {
          test: /\.(svg|bmp|gif|png|jpe?g)$/,
          loader: require.resolve('file-loader'),
          options: {
            name: '[name].[hash:8].[ext]'
          }
        },
        {
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: isFast ? require.resolve('..') : require.resolve('css-loader'),
              options: {
                import: true
              }
            }
          ]
        },
      ]
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: '[name].css'
      }),
    ]
  }
}

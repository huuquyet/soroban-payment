const webpack = require('webpack')
const HtmlWebPackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')
const path = require('path')

const { DEFAULT_STATS } = require.resolve('./stats')

const BUILD_PATH = path.resolve(__dirname, '../build')

const commonConfig = (env) => ({
  entry: {
    index: ['babel-polyfill', path.resolve(__dirname, '../src/index.tsx')],
  },
  watchOptions: {
    ignored: ['node_modules/**/*', 'build/**/*'],
  },
  output: {
    path: BUILD_PATH,
    filename: '[contenthash].js',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    plugins: [
      new TsconfigPathsPlugin({
        configFile: path.resolve(__dirname, '../tsconfig.json'),
      }),
    ],
    fallback: {
      buffer: require.resolve('buffer/'),
    },
  },
  module: {
    rules: [
      {
        test: /\.m?js/,
        type: 'javascript/auto',
      },
      {
        test: /\.m?js/,
        resolve: {
          fullySpecified: false,
        },
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: require.resolve('html-loader'),
          },
        ],
      },
      {
        test: /\.(ts|tsx)$/,
        use: [require.resolve('ts-loader')],
        exclude: /node-modules/,
      },
      {
        test: /\.(js)$/,
        use: [require.resolve('babel-loader')],
        include: /webextension-polyfill/,
      },
      {
        test: /\.png$/,
        use: [
          {
            loader: require.resolve('file-loader'),
          },
        ],
      },
      {
        test: /\.(css|sass|scss)$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: require.resolve('css-loader'),
            options: {
              sourceMap: true,
            },
          },
          { loader: require.resolve('sass-loader') },
        ],
      },
      {
        test: /\.(woff(2)?|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
        use: [
          {
            loader: require.resolve('file-loader'),
            options: {
              name: '[name].[ext]',
              outputPath: 'fonts/',
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebPackPlugin({
      template: path.resolve(__dirname, '../public/index.html'),
      chunks: ['index'],
      filename: `${BUILD_PATH}/index.html`,
    }),
    new MiniCssExtractPlugin({
      filename: 'style.min.css',
      chunkFilename: '[name].min.css',
    }),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
  ],
  stats: DEFAULT_STATS,
  devServer: {
    hot: true,
  },
})

module.exports.commonConfig = commonConfig
module.exports.BUILD_PATH = BUILD_PATH

import { defineConfig } from 'umi';
const { resolve, join } = require('path');

export default defineConfig({
  hash: false,
  dynamicImport: {
    loading: 'components/Loader',
  },
  // dynamicImport: false,
  // history: { type: "hash" },

  targets: { ie: 11 },
  dva: { immer: true },
  ignoreMomentLocale: true,
  mountElementId: "root",
  nodeModulesTransform: {
    type: 'none',
  },
  // ssr: {
  //   devServerRender: true,
  // },
  alias: {
    antd: resolve(__dirname, './node_modules/antd'),
    api: resolve(__dirname, './node_modules/@ragestudio/nodecore-api-lib/src'),
    plugins: resolve(__dirname, './plugins'),
    globals: resolve(__dirname, './globals'),
    debuggers: resolve(__dirname, './src/debuggers'),
    core: resolve(__dirname, './src/core'),
    theme: resolve(__dirname, './src/theme'),
    config: resolve(__dirname, './config'),
    components: resolve(__dirname, './src/components'),
    models: resolve(__dirname, './src/models'),
    node_modules: resolve(__dirname, './node_modules')
  },
  extraBabelPlugins: [
    [
      'import',
      {
        libraryName: 'lodash',
        libraryDirectory: '',
        camel2DashComponentName: false,
      },
      'lodash',
    ],
  ],

  // chainWebpack: function(config, { webpack }) {
  //   config.module
  //     .rule('js-in-node_modules')
  //     .exclude.add(/node_modules/)
  //     .end()
  //   config.module
  //     .rule('ts-in-node_modules')
  //     .exclude.add(/node_modules/)
  //     .end()
    // config.merge({
    //   optimization: {
    //     minimize: true,
    //     splitChunks: {
    //       chunks: 'all',
    //       minSize: 30000,
    //       minChunks: 3,
    //       automaticNameDelimiter: '.',
    //       cacheGroups: {
    //         react: {
    //           name: 'react',
    //           priority: 20,>
    //           test: /[\\/]node_modules[\\/](react|react-dom|react-dom-router)[\\/]/,
    //         },
    //         antd: {
    //           name: 'antd',
    //           priority: 20,
    //           test: /[\\/]node_modules[\\/](antd|@ant-design\/icons)[\\/]/,
    //         },
    //         async: {
    //           chunks: 'async',
    //           minChunks: 2,
    //           name: 'async',
    //           maxInitialRequests: 1,
    //           minSize: 0,
    //           priority: 5,
    //           reuseExistingChunk: true,
    //         },
    //       },
    //     },
    //   },
    // })
  // },
  
})

import config from './config/index.js'
import { defineConfig, chainWebpack } from 'umi'
import { resolve } from 'path'

let configs = {
  hash: true,
  title: config.app.siteName ?? null,
  dynamicImport: {
    loading: 'components/Loader',
  },
  targets: { ie: 11 },
  dva: { immer: true, hmr: true },
  ignoreMomentLocale: true,
  mountElementId: "root",
  nodeModulesTransform: {
    type: 'none',
  },
  exportStatic: {
    dynamicRoot: false,
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
    pages: resolve(__dirname, './src/pages'),
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
}
  
if (typeof(config.runtime) !== "undefined") {
  configs = { ...configs, ...config.runtime }
}

export default defineConfig(configs)

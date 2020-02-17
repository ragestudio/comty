// https://umijs.org/config/
import { resolve } from 'path';
import { i18n } from './config/ycore.config.js';
export default {
  ignoreMomentLocale: true,
  targets: {
    ie: 9,
  },
  treeShaking: true,
  plugins: [
    [
      'umi-plugin-react',
      {
        dva: {
          immer: true,
          hmr: true,
        },
        antd: true,
        dynamicImport: {
          webpackChunkName: true,
          loadingComponent: './components/Loader/Loader',
        },
       
        routes: {
          exclude: [
            /model\.(j|t)sx?$/,
            /service\.(j|t)sx?$/,
            /models\//,
            /components\//,
            /services\//,
          ],
          update: routes => {
            if (!i18n) return routes;
            const newRoutes = [];

            for (const item of routes[0].routes) {
              newRoutes.push(item);

              if (item.path) {
                newRoutes.push(
                  Object.assign({}, item, {
                    path: `/:lang(${i18n.languages.map(item => item.key).join('|')})` + item.path,
                  })
                );
              }
            }

            routes[0].routes = newRoutes;
            return routes;
          },
        },
        dll: false,
        pwa: {
          manifestOptions: {
            srcPath: 'manifest.json',
          },
        },
        hd: false,
      },
    ],
  ],
  // Theme for antd
  // https://ant.design/docs/react/customize-theme
  theme: './config/theme.config.js',
  // Webpack Configuration
  alias: {
    ycore: resolve(__dirname, './src/@ycore/ycore_worker.js'),
    api: resolve(__dirname, './src/services/'),
    globals: resolve(__dirname, './globals'),
    components: resolve(__dirname, './src/components'),
    config: resolve(__dirname, './config/ycore.config.js'),
    models: resolve(__dirname, './src/models'),
    routes: resolve(__dirname, './src/routes'),
    services: resolve(__dirname, './src/services'),
    themes: resolve(__dirname, './src/themes'),
    utils: resolve(__dirname, './src/utils'),
  },
  extraBabelPresets: ['@lingui/babel-preset-react'],
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
};


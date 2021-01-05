// @ts-nocheck
import React from 'react';
import { ApplyPluginsType, dynamic } from '/Users/srgooglo/repos/comty/packages/comty/node_modules/@umijs/runtime';
import * as umiExports from './umiExports';
import { plugin } from './plugin';
import LoadingComponent from 'components/Loader';

export function getRoutes() {
  const routes = [
  {
    "path": "/",
    "component": dynamic({ loader: () => import(/* webpackChunkName: 'layouts__index' */'@/layouts/index.js'), loading: LoadingComponent}),
    "routes": [
      {
        "path": "/404",
        "exact": true,
        "component": dynamic({ loader: () => import(/* webpackChunkName: 'p__404' */'@/pages/404.js'), loading: LoadingComponent})
      },
      {
        "path": "/@/:user",
        "exact": true,
        "component": dynamic({ loader: () => import(/* webpackChunkName: 'p__@__user' */'@/pages/@/[user].js'), loading: LoadingComponent})
      },
      {
        "path": "/debug",
        "exact": true,
        "component": dynamic({ loader: () => import(/* webpackChunkName: 'p__debug__index' */'@/pages/debug/index.js'), loading: LoadingComponent})
      },
      {
        "path": "/explore",
        "exact": true,
        "component": dynamic({ loader: () => import(/* webpackChunkName: 'p__explore__index' */'@/pages/explore/index.js'), loading: LoadingComponent})
      },
      {
        "path": "/index.html",
        "exact": true,
        "component": dynamic({ loader: () => import(/* webpackChunkName: 'p__index' */'@/pages/index.js'), loading: LoadingComponent})
      },
      {
        "path": "/",
        "exact": true,
        "component": dynamic({ loader: () => import(/* webpackChunkName: 'p__index' */'@/pages/index.js'), loading: LoadingComponent})
      },
      {
        "path": "/login/guest",
        "exact": true,
        "component": dynamic({ loader: () => import(/* webpackChunkName: 'p__login__guest' */'@/pages/login/guest.js'), loading: LoadingComponent})
      },
      {
        "path": "/login",
        "exact": true,
        "component": dynamic({ loader: () => import(/* webpackChunkName: 'p__login__index' */'@/pages/login/index.js'), loading: LoadingComponent})
      },
      {
        "path": "/login/login",
        "exact": true,
        "component": dynamic({ loader: () => import(/* webpackChunkName: 'p__login__login' */'@/pages/login/login.js'), loading: LoadingComponent})
      },
      {
        "path": "/login/register",
        "exact": true,
        "component": dynamic({ loader: () => import(/* webpackChunkName: 'p__login__register' */'@/pages/login/register.js'), loading: LoadingComponent})
      },
      {
        "path": "/logout",
        "exact": true,
        "component": dynamic({ loader: () => import(/* webpackChunkName: 'p__logout' */'@/pages/logout.js'), loading: LoadingComponent})
      },
      {
        "path": "/new_streaming",
        "exact": true,
        "component": dynamic({ loader: () => import(/* webpackChunkName: 'p__new_streaming__index' */'@/pages/new_streaming/index.js'), loading: LoadingComponent})
      },
      {
        "path": "/post",
        "exact": true,
        "component": dynamic({ loader: () => import(/* webpackChunkName: 'p__post' */'@/pages/post.js'), loading: LoadingComponent})
      },
      {
        "path": "/saves",
        "exact": true,
        "component": dynamic({ loader: () => import(/* webpackChunkName: 'p__saves' */'@/pages/saves.js'), loading: LoadingComponent})
      },
      {
        "path": "/settings",
        "exact": true,
        "component": dynamic({ loader: () => import(/* webpackChunkName: 'p__settings__index' */'@/pages/settings/index.js'), loading: LoadingComponent})
      },
      {
        "path": "/streams",
        "exact": true,
        "component": dynamic({ loader: () => import(/* webpackChunkName: 'p__streams__index' */'@/pages/streams/index.js'), loading: LoadingComponent})
      },
      {
        "path": "/:indexer",
        "exact": true,
        "component": dynamic({ loader: () => import(/* webpackChunkName: 'p__indexer' */'@/pages/[indexer].js'), loading: LoadingComponent})
      }
    ]
  }
];

  // allow user to extend routes
  plugin.applyPlugins({
    key: 'patchRoutes',
    type: ApplyPluginsType.event,
    args: { routes },
  });

  return routes;
}

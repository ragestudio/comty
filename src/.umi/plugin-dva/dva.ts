// @ts-nocheck
import { Component } from 'react';
import { ApplyPluginsType } from 'umi';
import dva from 'dva';
// @ts-ignore
import createLoading from '/Users/srgooglo/repos/comty/node_modules/dva-loading/dist/index.esm.js';
import { plugin, history } from '../core/umiExports';
import ModelApp0 from '/Users/srgooglo/repos/comty/src/models/app.js';
import ModelContextMenu1 from '/Users/srgooglo/repos/comty/src/models/contextMenu.js';
import ModelExtended2 from '/Users/srgooglo/repos/comty/src/models/extended.js';
import ModelSocket3 from '/Users/srgooglo/repos/comty/src/models/socket.ts';
import ModelStreaming4 from '/Users/srgooglo/repos/comty/src/models/streaming.js';
import ModelUser5 from '/Users/srgooglo/repos/comty/src/models/user.ts';

let app:any = null;

export function _onCreate(options = {}) {
  const runtimeDva = plugin.applyPlugins({
    key: 'dva',
    type: ApplyPluginsType.modify,
    initialValue: {},
  });
  app = dva({
    history,
    
    ...(runtimeDva.config || {}),
    // @ts-ignore
    ...(typeof window !== 'undefined' && window.g_useSSR ? { initialState: window.g_initialProps } : {}),
    ...(options || {}),
  });
  
  app.use(createLoading());
  app.use(require('/Users/srgooglo/repos/comty/node_modules/dva-immer/dist/index.js')());
  (runtimeDva.plugins || []).forEach((plugin:any) => {
    app.use(plugin);
  });
  app.model({ namespace: 'app', ...ModelApp0 });
app.model({ namespace: 'contextMenu', ...ModelContextMenu1 });
app.model({ namespace: 'extended', ...ModelExtended2 });
app.model({ namespace: 'socket', ...ModelSocket3 });
app.model({ namespace: 'streaming', ...ModelStreaming4 });
app.model({ namespace: 'user', ...ModelUser5 });
  return app;
}

export function getApp() {
  return app;
}

export class _DvaContainer extends Component {
  constructor(props: any) {
    super(props);
    // run only in client, avoid override server _onCreate()
    if (typeof window !== 'undefined') {
      _onCreate();
    }
  }

  componentWillUnmount() {
    let app = getApp();
    app._models.forEach((model:any) => {
      app.unmodel(model.namespace);
    });
    app._models = [];
    try {
      // 释放 app，for gc
      // immer 场景 app 是 read-only 的，这里 try catch 一下
      app = null;
    } catch(e) {
      console.error(e);
    }
  }

  render() {
    const app = getApp();
    app.router(() => this.props.children);
    return app.start()();
  }
}

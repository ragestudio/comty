import { router, verbosity, appInterface } from 'core/libs'
import { DynamicSDCP } from 'core/libs/dynamicsdcp'
import settings from 'core/libs/settings'
import * as core from 'core'


export default {
  namespace: 'extended',
  state: {
    modules: { core, settings, verbosity, router, DynamicSDCP },
    sidebar: null,
    contextMenu: null
  },
  subscriptions: {
    setup({ dispatch }) {
      dispatch({ type: 'query' });
    },
  },
  effects: {
    *query({ payload }, { call, put, select }) {
    
    }
  },
  reducers: {
    updateState(state, { payload }) {
      return {
        ...state,
        ...payload,
      };
    },
  },
};

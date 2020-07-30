/* global window */
import store from 'store';
import { pathMatchRegexp, queryLayout } from 'core';
import { app_config } from 'config';
import keys from 'config/app_keys';
import * as core from 'core';
import { session } from 'core/cores';
import verbosity from 'core/libs/verbosity'

export default {
  namespace: 'app',
  state: {
    server_key: keys.server_key,

    service_valid: false,
    ng_services: false,
    session_valid: false,

    session_token: null,
    session_data: null,
    session_uuid: null,

    overlayActive: false,
    overlayElement: null,

    controlActive: false,
    feedOutdated: false,

    app_settings: store.get(app_config.app_settings_storage),
    app_theme: store.get(app_config.appTheme_container),
    notifications: [],
    locationQuery: {},
    
  },
  subscriptions: {
    setup({ dispatch }) {
      dispatch({ type: 'query' });
    },
    setupHistory({ dispatch, history }) {
      history.listen(location => {
        dispatch({
          type: 'updateState',
          payload: {
            locationPathname: location.pathname,
            locationQuery: location.query,
          },
        });
      });
    },
    setupRequestCancel({ history }) {
      history.listen(() => {
        const { cancelRequest = new Map() } = window;

        cancelRequest.forEach((value, key) => {
          if (value.pathname !== window.location.pathname) {
            value.cancel('cancel request');
            cancelRequest.delete(key);
          }
        });
      });
    },
  },
  effects: {
    *query({ payload }, { call, put, select }) {
      const service = yield select(state => state.app.service_valid);
      if (!service) {
        console.error('❌ Cannot connect with validate session service!');
        return yield put({
          type: 'updateState',
          payload: { service_valid: false },
        });
      }

      if (session) {
        if (pathMatchRegexp(['/', '/login'], window.location.pathname)) {
          app.router.push({ pathname: `${app_config.MainPath}` });
        }

        return true;
      } else if (
        !pathMatchRegexp(['', '/login'], window.location.pathname) &&
        queryLayout(config.layouts, window.location.pathname) !== 'public'
      ) {
        if (validBackup == true) {
          // logout normal
        } else {
          core.router.push({ pathname: '/login' });
        }
      }
    },
    *update({ payload }, { call, put, select }) {
      const session = yield select(state => state.app.session_valid);
      const session_uuid = yield select(state => state.app.session_uuid);

      console.log(payload);
      if (session) {
        // request getData
      } else {
        // invalid update token (session not valid)
      }
    },
    *logout({ payload }, { call, put, select }) {
      // call logout api
      return yield put({ type: 'disconnectServices' });
    },
    *login({ payload }, { call, put, select }) {
      if (!payload) return false;
      const serverKey = yield select(state => state.app.server_key);
      const requestPayload = { username: payload.username, password: payload.password, server_key: serverKey }
      session.auth(requestPayload, (err, res) => {
        if (err) {
          const { status, message } = err;
          return console.log(status, message);
        }
      });
    },
    *updateTheme({payload}, {call, put, select}){
      if (!payload) return false;
      let tmp = []

      const keys = Object.keys(payload)
      const values = Object.values(payload)
      const lenght = keys.length
  
      for (let i = 0; i < lenght; i++) {
        let obj = {}
        obj.key = keys[i]
        obj.value = values[i]
  
        tmp[i] = obj
      }

      return yield put({ type: 'handleUpdateTheme', payload: tmp });

    },
  },
  reducers: {
    updateState(state, { payload }) {
      return {
        ...state,
        ...payload,
      };
    },

    handleThemeChange(state, { payload }) {
      store.set('theme', payload);
      state.theme = payload;
    },

    allNotificationsRead(state) {
      state.notifications = [];
    },

    handleUpdateTheme(state, { payload }) {
      verbosity.debug(payload)
      store.set(app_config.appTheme_container, payload);
      state.app_theme = payload
    },

    disconnectServices(state) {
      state.service_valid = false;
      state.session_valid = false;
      state.session_data = null;
      state.session_token = null;
    },
  },
};

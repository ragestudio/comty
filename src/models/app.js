/* global window */
import store from 'store';
import { pathMatchRegexp, queryLayout } from 'core';
import { app_config } from 'config';
import keys from 'config/app_keys';
import { router } from 'core/cores';
import verbosity from 'core/libs/verbosity'
import { notify } from 'core/libs/interface/notify'

export default {
  namespace: 'app',
  state: {
    server_key: keys.server_key,

    service_valid: false,
    ng_services: false,
    session_valid: false,

    session_token: sessionStorage.getItem('session'),
    session_data: null,
    session_uuid: null,

    overlayActive: false,
    overlayElement: null,

    controlActive: false,
    feedOutdated: false,

    app_settings: store.get(app_config.app_settings_storage),
    app_theme: store.get(app_config.appTheme_container) || [],
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
      const session = yield select(state => state.app.session_valid);

      yield put({ type: 'updateFrames' })

      if (!service) {
        console.error('❌ Cannot connect with validate session service!');
      }


      // if (session) {
      //   if (pathMatchRegexp(['/', '/login'], window.location.pathname)) {
      //     app.router.push({ pathname: `${app_config.MainPath}` });
      //   }

      //   return true;
      // } else if (
      //   !pathMatchRegexp(['', '/login'], window.location.pathname) &&
      //   queryLayout(config.layouts, window.location.pathname) !== 'public'
      // ) {
      //   if (validBackup == true) {
      //     // logout normal
      //   } else {
      //     core.router.push({ pathname: '/login' });
      //   }
      // }
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
      
      const { user_id, access_token } = payload.authFrame
  
      return yield put({ type: 'handleLogin', payload: { user_id, access_token, user_data: payload.dataFrame } })
    },
    *updateTheme({payload}, {put, select}){
      if (!payload) return false
      let container = yield select(state => state.app.app_theme)
      let style_keys = []
      let tmp = []
  
      container.forEach((e)=>{style_keys[e.key] = e.value})

      if(!style_keys[payload.key]){
        tmp.push({key: payload.key, value: payload.value})
      }
      container.forEach((e) => {
        let obj = {}
        if(e.key === payload.key){
          obj = { key: payload.key, value: payload.value }
        }else{
          obj = { key: e.key, value: e.value }
        }
        tmp.push(obj)
      })


      return tmp? yield put({ type: 'handleUpdateTheme', payload: tmp }) : null
    },
  },
  reducers: {
    updateState(state, { payload }) {
      return {
        ...state,
        ...payload,
      };
    },
    updateFrames(state) {
      let sessionAuthframe = sessionStorage.getItem('session')
      let sessionDataframe = sessionStorage.getItem('data')
      
      try {
        if (sessionAuthframe) {
          sessionAuthframe = JSON.parse(atob(sessionAuthframe))
        }  
        if (sessionDataframe) {
          sessionDataframe = JSON.parse(atob(sessionDataframe))
        } 

        state.session_token = sessionAuthframe.session_token,
        state.session_uuid = sessionAuthframe.session_uuid
        state.session_data = sessionDataframe
      } catch (error) {
        verbosity.error(error)
      }
    },
    handleLogin(state, { payload }){
      if (!payload) return false

      state.session_token = payload.access_token
      state.session_uuid = payload.user_id
      state.session_data = payload.user_data

      const sessionAuthframe = btoa(JSON.stringify({session_token: payload.access_token, session_uuid: payload.user_id}))
      const sessionDataframe = btoa(payload.user_data)

      sessionStorage.setItem('session', sessionAuthframe)
      sessionStorage.setItem('data', sessionDataframe)
      notify.success('Login done!')
      router.push('/')
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


/* global window */
import { router } from 'utils'
import { stringify } from 'qs'
import store from 'store'
import { queryLayout, pathMatchRegexp } from 'utils'
import api from 'api'
import config from 'config'
import * as ycore from 'ycore'

export default {
  namespace: 'app',
  state: {
    AppSettings: store.get('app_settings') || config.defaultSettings,
    theme: store.get('theme') || 'light',
    locationQuery: {},
  },
  subscriptions: {
    setupHistory({ dispatch, history }) {
      history.listen(location => {
        dispatch({
          type: 'updateState',
          payload: {
            locationPathname: location.pathname,
            locationQuery: location.query,
          },
        })
      })
    },

    setupRequestCancel({ history }) {
      history.listen(() => {
        const { cancelRequest = new Map() } = window
        cancelRequest.forEach((value, key) => {
          if (value.pathname !== window.location.pathname) {
            value.cancel('Canceling...')
            cancelRequest.delete(key)
          }
        })
      })
    },
    setup({ dispatch }) {
      dispatch({ type: 'query' })
    },
  },
  effects: {
    *query({payload}, { call, put, select }) {     
     
      const validBackup = ycore.ValidBackup();
      if ( ycore.ValidLoginSession() == true) {
          if (pathMatchRegexp(['/', '/login'], window.location.pathname)) {
            router.push({pathname: '/main',})
            ycore.RefreshONCE()
          }
          ycore.MakeBackup()
          ycore.UpdateSDCP()
          return true
      } 
      else if(!pathMatchRegexp(['','/login'], window.location.pathname)) {
          if (validBackup == true) {
            ycore.LogoutCall()
          } 
         else{
            router.push({pathname: '/login',})
            ycore.RefreshONCE()
          }
      }
      if(pathMatchRegexp([''], window.location.pathname)){
        router.push({pathname: '/login',})
      }

    },
  },
  reducers: {
    updateState(state, { payload }) {
      return {
        ...state,
        ...payload,
      }
    },

    handleThemeChange(state, { payload }) {
      store.set('theme', payload)
      state.theme = payload
    },

    allNotificationsRead(state) {
      state.notifications = []
    },
  },
}

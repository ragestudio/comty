/* global window */
import { router } from 'utils'
import store from 'store'
import { pathMatchRegexp, queryLayout } from 'utils'
import config from 'config'
import * as app from 'app'

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
    *query({ payload }, { call, put, select }) {
      // if (queryLayout(config.layouts, window.location.pathname) == 'public') {
      //   return true
      // }
      const validBackup = app.validate.backup()
      if (app.validate.session() == true) {
        if (pathMatchRegexp(['/', '/login'], window.location.pathname)) {
          router.push({ pathname: `${config.MainPath}` })
        }
        app._app.query()        
        return true
      } else if (!pathMatchRegexp(['', '/login'], window.location.pathname) && queryLayout(config.layouts, window.location.pathname) !== 'public') {
        if (validBackup == true) {
          app._app.logout()
        } else {
          router.push({ pathname: '/login' })
        }
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

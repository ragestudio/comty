import store from 'store'
import config from 'config'
import keys from 'config/app_keys'
import { session } from 'core/models'
import { router, verbosity, ui } from 'core/libs'
import settings from 'core/libs/settings'
import { queryIndexer } from 'core'
import Cryptr from 'cryptr'

import jwt from 'jsonwebtoken'
import cookie from 'cookie_js'

export default {
  namespace: 'app',
  state: {
    fadeclock: 500,
    splash: {
      render: true,
      fadeout: false
    },
    queryDone: false,
    style_prefix: config.app.defaultStyleClass ?? "app_",
    env_proccess: process.env,
    server_key: keys.server_key,

    service_valid: false,
    session_valid: false,

    session_authframe: null,
    session_token: null,
    session_data: null,
    session_uuid: null,

    sidebar_collapsed: store.get("sidebar_collapse") ?? false,
    overlayActive: false,
    overlayElement: null,
    embedded: false,
    dispatcher: null,

    electron: null,
    app_settings: store.get(config.app.storage_appSettings) || [],
    app_theme: store.get(config.app.storage_theme) || [],
    notifications: [],
  },
  subscriptions: {
    setup({ dispatch }) {
      dispatch({ type: 'updateState', payload: { dispatcher: dispatch } })
      dispatch({ type: 'earlyInit' })
      dispatch({ type: 'updateFrames' })
      dispatch({ type: 'validateSession' })
      dispatch({ type: 'initHeaderSocket' })
      dispatch({ type: 'query' })
    },
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
            cancelRequest.delete(key);
          }
        })
      })
    },
  },
  effects: {
    *earlyInit({ dispatcher }, { call, put, select }) {
      const state = yield select(state => state.app)

      window.classToStyle = (key) => {
        if (typeof (key) !== "string") {
          try {
            const toString = JSON.stringify(key)
            if (toString) {
              return toString
            } else {
              return null
            }
          } catch (error) {
            return null
          }
        }
        if (typeof (state.style_prefix) !== "undefined") {
          return `${state.style_prefix}${key}`
        }
        return key
      }

      try {
        const electron = window.require("electron")
        state.dispatcher({ type: 'updateState', payload: { electron, embedded: true } })
      } catch (error) {
        // nothing
      }

    },
    *query({ payload }, { call, put, select }) {
      const state = yield select(state => state.app)

      window.PluginGlobals = []
      window.Internal = []

      queryIndexer([
        {
          match: '/s;:id',
          to: `/settings?key=:id`,
        },
        {
          match: '/h;:id',
          to: `/hashtag?key=:id`,
        },
        {
          match: '/post/:id',
          to: `/post?key=:id`,
        },
        {
          match: '/@:id',
          to: `/@/:id`,
        }
      ], (callback) => {
        window.location = callback
      })

      if (state.session_valid) {
        if (state.session_authframe && state.session_data) {
          state.dispatcher({ type: "closeSplash" })
        } else {
          setTimeout(() => location.reload(), 5000)
        }
      } else {
        state.dispatcher({ type: "closeSplash" })
      }
    },
    *closeSplash({ }, { select }) {
      const state = yield select(state => state.app)
      state.dispatcher({ type: "updateState", payload: { queryDone: true, splash: { render: true, fadeout: state.fadeclock } } })
      setTimeout(() => {
        state.dispatcher({ type: "updateState", payload: { splash: { render: false, fadeout: false } } })
      }, state.fadeclock)
    },
    *initHeaderSocket({ callback }, { call, put, select }) {
      const state = yield select(state => state.app)

      state.dispatcher({
        type: 'socket/createNodeSocket', payload: {
          locked: true,
          isHeader: true
        },
        then: () => {
          state.dispatcher({ type: "updateState", payload: { service_valid: true } })
        }
      })
    },
    *refreshToken({ callback }, { call, put, select }) {
      const state = yield select(state => state.app)
      state.dispatcher({
        type: "socket/use",
        scope: "auth",
        invoke: "token",
        query: {
          payload: {
            token: state.session_authframe
          },
          callback: (callbackResponse) => {
            if (typeof (callback) !== "undefined") {
              callback(callbackResponse)
            }
            verbosity([callbackResponse])
            if (callbackResponse.code == 100) {
              state.dispatcher({
                type: "setAuth", payload: {
                  token: callbackResponse.response.token,
                  authFrame: jwt.decode(callbackResponse.response.token),
                  dataFrame: state.session_data
                }
              })
              state.dispatcher({ type: "updateState", payload: { session_valid: true } })
            }
            if (callbackResponse.code == 110) {
              verbosity(`this session is no valid, erasing data`)
              state.dispatcher({ type: "sessionErase" }) // remove without calling api, its already logged out/invalid
            }
          }
        }
      })

    },
    *logout({ payload }, { put, select }) {
      const state = yield select(state => state.app)

      session.deauth({
        id: state.session_uuid,
        userToken: state.session_token,
        server_key: state.server_key
      }, (err, res) => {
        verbosity([res])
        state.dispatcher({ type: "sessionErase" })
      })

    },
    *login({ payload, callback }, { call, put, select }) {
      const state = yield select(state => state.app)
      if (!payload) return false
      const cryptr = new Cryptr(keys.server_key)

      state.dispatcher({
        type: "socket/use",
        scope: "auth",
        invoke: "authentication",
        query: {
          payload: {
            username: btoa(payload.username),
            password: cryptr.encrypt(payload.password)
          },
          callback: (callbackResponse) => {
            console.log(callbackResponse)
            const { authFrame, dataFrame, token } = callbackResponse.response
            if (typeof (callback) !== "undefined") {
              callback(callbackResponse.code)
            }
            if (callbackResponse.code == 100) {
              state.dispatcher({ type: "setAuth", payload: { token, authFrame, dataFrame } })
              location.reload()
            }
          }
        }
      })
    },
    *validateSession({ payload }, { put, select }) {
      const state = yield select(state => state.app)
      if (state.session_authframe) {
        if (typeof (state.session_authframe.exp) == "undefined") {
          return false // no support refresh token when is invalid by ws
        }

        const now = new Date()
        const createdIat = state.session_authframe.iat * 1000
        const expirationTime = (state.session_authframe.iat + state.session_authframe.exp) * 1000

        const isExpired = expirationTime < now.getTime()

        verbosity([`TOKEN EXPIRES => (${new Date(expirationTime).toLocaleString()})`, `NOW => (${now.toLocaleString()})`])

        if (isExpired) {
          verbosity(`🕒 This session_token is expired`, { color: "red" })
          if (settings("session_noexpire")) {
            verbosity(`(session_noexpire) is enabled, refreshing token`)
            state.dispatcher({ type: "refreshToken" })
          } else {
            return state.dispatcher({ type: "sessionErase" }) // remove session
          }
        }

        if (!state.session_data) {
          verbosity(`session_data is not valid but the session is valid, updating from ws`)
          state.dispatcher({ type: "updateUserData" })
        }

        state.dispatcher({ type: "updateState", payload: { session_valid: true } })
      }
    },
    *updateUserData({ payload }, { put, select }) {
      const state = yield select(state => state.app)

      state.dispatch({
        type: "socket/use",
        scope: "users",
        invoke: "get",
        query: {
          payload: {
            from: "data",
            user_id: state.app.session_uuid,
            userToken: state.app.session_token
          },
          callback: (callbackResponse) => {
            try {
              sessionStorage.setItem(config.app.storage_dataFrame, btoa(JSON.stringify(callbackResponse.response)))
              return state.dispatcher({ type: "updateState", payload: { session_data: callbackResponse.response } })
            } catch (error) {
              verbosity([error])
            }
          }
        }
      })

    },
    *updateTheme({ payload }, { put, select }) {
      if (!payload) return false
      let container = yield select(state => state.app.app_theme)
      let style_keys = []
      let tmp = []

      container.forEach((e) => { style_keys[e.key] = e.value })

      if (!style_keys[payload.key]) {
        tmp.push({ key: payload.key, value: payload.value })
      }
      container.forEach((e) => {
        let obj = {}
        if (e.key === payload.key) {
          obj = { key: payload.key, value: payload.value }
        } else {
          obj = { key: e.key, value: e.value }
        }
        tmp.push(obj)
      })
      return tmp ? yield put({ type: 'handleUpdateTheme', payload: tmp }) : null
    },
    *updateFrames({ payload }, { select, put }) {
      try {
        let sessionAuthframe = cookie.get(config.app.storage_authFrame)
        let sessionDataframe = atob(sessionStorage.getItem(config.app.storage_dataFrame))

        if (sessionAuthframe) {
          try {
            sessionAuthframe = jwt.decode(sessionAuthframe)
            yield put({
              type: "updateState",
              payload: {
                session_authframe: sessionAuthframe,
                session_token: sessionAuthframe.session_token,
                session_uuid: sessionAuthframe.session_uuid
              }
            })
          } catch (error) {
            cookie.remove(config.app.storage_authFrame)
          }
        }
        if (sessionDataframe) {
          try {
            sessionDataframe = JSON.parse(sessionDataframe)
            yield put({
              type: "updateState",
              payload: {
                session_data: sessionDataframe
              }
            })
          } catch (error) {
            sessionDataframe = null
            sessionStorage.clear()
          }
        }
      } catch (error) {
        verbosity([error])
      }

    }
  },
  reducers: {
    updateState(state, { payload }) {
      return {
        ...state,
        ...payload,
      };
    },
    setAuth(state, { payload }) {
      if (!payload) return false
      state.session_token = payload.authFrame.session_token
      state.session_uuid = payload.authFrame.session_uuid
      state.session_data = payload.dataFrame
      state.session_authframe = jwt.decode(payload.token)
      state.session_valid = true

      cookie.set(config.app.storage_authFrame, payload.token)
      sessionStorage.setItem(config.app.storage_dataFrame, btoa(JSON.stringify(payload.dataFrame)))
    },
    handleUpdateTheme(state, { payload }) {
      verbosity([payload])
      store.set(config.app.storage_theme, payload)
      state.app_theme = payload
    },
    requireQuery(state, { payload, callback }) {
      if (!payload || !callback) return false
      switch (payload) {
        case 'login': {
          callback(state.session_valid)
          break;
        }
        case 'guest': {
          callback(!state.session_valid)
          break;
        }
        case 'dev': {
          if (state.session_data) {
            return callback(state.session_data.dev ? true : false)
          }
          return callback(false)
        }
        case 'embedded': {
          callback(state.electron ? true : false)
          break;
        }
        default: {
          break;
        }
      }
    },
    ipcInvoke(state, { payload }) {
      if (!payload || !state.embedded) {
        return false
      }
      const ipc = state.electron.ipcRenderer
      ipc.invoke(payload.key, payload.payload)
    },
    ipcSend(state, { payload }) {
      if (!payload || !state.embedded) {
        return false
      }
      const ipc = state.electron.ipcRenderer
      ipc.send(payload.key, payload.payload)
    },
    sessionErase(state) {
      state.service_valid = false;
      state.session_valid = false;
      state.session_data = null;
      state.session_token = null;
      state.session_authframe = null;
      cookie.remove(config.app.storage_authFrame)
      sessionStorage.clear()
      location.reload()
    },
  },
}

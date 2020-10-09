import store from 'store'
import { app_config } from 'config'
import keys from 'config/app_keys'
import { user, session } from 'core/models'
import { router, verbosity, appInterface } from 'core/libs'
import settings from 'core/libs/settings'
import { uri_resolver } from 'api/lib'
import { queryIndexer } from 'core'

import jwt from 'jsonwebtoken'
import cookie from 'cookie_js'
import { usePlugins } from 'plugins'
import { SocketConnection } from 'core/libs/socket/index.ts'

export default {
  namespace: 'app',
  state: {
    env_proccess: process.env,
    socket_conn: null,
    socket_opt: null,
    server_key: keys.server_key,
    resolvers: null,

    service_valid: false,
    ng_services: false,
    session_valid: false,

    session_authframe: null,
    session_token: null,
    session_data: null,
    session_uuid: null,

    contextMenu: {
      visible: false,
      fragment: null,
      yPos: 0,
      xPos: 0
    },
    sidebar_collapsed: store.get("sidebar_collapse"),
    overlayActive: false,
    overlayElement: null,
    embedded: false,

    controlActive: false,
    feedOutdated: false,

    electron: null,
    app_settings: store.get(app_config.app_settings_storage),
    app_theme: store.get(app_config.appTheme_container) || [],
    notifications: [],
  },
  subscriptions: {
    setup({ dispatch }) {
      try {
        const electron = window.require("electron")
        dispatch({ type: 'updateState', payload: { electron, embedded: true } })
      } catch (error) {
        // nothing
      }
      uri_resolver().then(res => {
        dispatch({ type: 'handleUpdateResolvers', payload: res })
      })
      dispatch({ type: 'updateFrames' })
      dispatch({ type: 'handleValidate' })
      dispatch({ type: 'query', payload: { dispatcher: dispatch } });
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
            cancelRequest.delete(key);
          }
        });
      });
    },
  },
  effects: {
    *query({ payload }, { call, put, select }) {
      const service = yield select(state => state.app.service_valid)
      const session = yield select(state => state.app.session_valid)
      const sessionDataframe = yield select(state => state.app.session_data)

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
          match: '/p;:id',
          to: `/post?key=:id`,
        },
        {
          match: '/@:id',
          to: `/@/:id`,
        }
      ], (callback) => {
        window.location = callback
      })
   

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
          match: '/p;:id',
          to: `/post?key=:id`,
        },
        {
          match: '/@:id',
          to: `/@/:id`,
        }
      ], (callback) => {
        window.location = callback
      })
   

      if (!service) {

      }

      if (!sessionDataframe && session ) {
        yield put({ type: 'handleUpdateData' })
      }

    },
    *getStateConnector({payload}, { select }){
        const state = yield select(state => state.app)
        payload(state)
    },
    *logout({ payload }, { call, put, select }) {
      const uuid = yield select(state => state.app.session_uuid)
      const token = yield select(state => state.app.session_token)
      const sk = yield select(state => state.app.server_key)

      session.deauth({ id: uuid, userToken: token, server_key: sk }, (err, res) =>{
        verbosity(res)
      })
      yield put({ type: 'sessionErase' })
    },
    *login({ payload }, { call, put, select }) {
      if (!payload) return false;
      const { user_id, access_token } = payload.authFrame
      yield put({ type: 'handleLogin', payload: { user_id, access_token, user_data: payload.dataFrame } })
    },
    *initializeInternal({payload}, {select, put}){
      if(!payload) return false
      yield put({ type: "handleInternal", payload })
    },
    *initializeSocket({payload}, {select, put}){
      if(!payload) return false
      const { type, address } = payload
      yield put({ type: "handleSocket", payload: new SocketConnection(payload) })
    },
    *initializePlugins({ payload }, { select }){
        const extended = yield select(state => state.extended)

        if(!payload.array){
          verbosity("Only array map for initialize plugins","Please read SDK documentation for more info.")
          return false
        }
        try {
            usePlugins([payload.array], (err, results) => {
              if (err) {
                verbosity("Init error!", err)
                appInterface.notify.error("Plugin initialize error!", err)
                return false
              }
              const rootInit = results[0]
        
              if (!rootInit.uuid) {
                verbosity("Cannot initialize a plugin without UUID.","Please read SDK documentation for more info.")
                appInterface.notify.error("Cannot initialize a plugin without UUID.")
                return false
              }

              let plugin = {
                uuid: null,
                version: "n/a",
                title: "Blank"
              }
              plugin = {...plugin, ...rootInit}

              const rootClass = plugin.payload
              let extendedRequire = null

              class extendedPlugin extends rootClass{
                constructor(props){
                  super(props)
                }
              }
            
              if( typeof(plugin.requireExtends) !== "undefined" ) {
                console.log("Extending class with => ", plugin.requireExtends)
        
                plugin.requireExtends.forEach((e) => {
                  const RequireFrom = e.from
                  const RequireImport = e.import

                  const existScheme = typeof(RequireImport) !== "undefined" && typeof(RequireFrom) !== "undefined"
                  if(!existScheme){
                    verbosity("Invalid require extension!")
                    return false
                  }

                  if (Array.isArray(RequireImport)) {
                    RequireImport.forEach((e) => {
                      console.log(`Importing " ${e} " from [ ${RequireFrom} ]`)
                      extendedRequire[e] = require(RequireFrom)
                    })
                  }else{

                  }

                })
              }

              window.PluginGlobals[plugin.uuid] = new extendedPlugin({ extended, extendedRequire })

              appInterface.notify.open({
                message: `${plugin.title} v${plugin.version}`,
                description: `New plugin is now installed !`
              })
            })
        } catch (error) {
          verbosity("Unexpected catched exception! ", error)

        }
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
    *updateFrames({payload}, { select, put }) {
      try {
        const session = yield select(state => state.app.session_valid);
        let sessionAuthframe = cookie.get(app_config.session_token_storage)
        let sessionDataframe = sessionStorage.getItem(app_config.session_data_storage)

        if (sessionAuthframe) {
          try {
            sessionAuthframe = jwt.decode(sessionAuthframe)
            yield put({ type: 'handleUpdateAuthFrames', payload: sessionAuthframe })
          } catch (error) {
            cookie.remove(app_config.session_token_storage)
          }
        }
        if (sessionDataframe) {
          try {
            sessionDataframe = JSON.parse(atob(sessionDataframe))
            yield put({ type: 'handleUpdateDataFrames', payload: sessionDataframe })
          } catch (error) {
            sessionDataframe = null
            sessionStorage.clear()
          }
        }

      } catch (error) {
        verbosity(error)
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
    handleInternal(state, { payload }){
      verbosity(payload)
      if (Array.isArray(payload)) {
        payload.forEach((e) => {
          window.Internal[e.id] = e.payload
        })        
      }
    },
    handleUpdateResolvers(state, { payload }) {
      state.resolvers = payload
    },
    handleSocket(state, { payload }) {
      state.socket_conn = payload
      state.socket_opt = payload.opts
    },
    handleUpdateAuthFrames(state, { payload }) {
      state.session_authframe = payload
      state.session_token = payload.session_token,
      state.session_uuid = payload.session_uuid
    },
    handleUpdateDataFrames(state, { payload }) {
      state.session_data = payload
    },
    handleValidate(state){
      if (state.session_authframe) {
        if (settings("session_noexpire")) {
          state.session_valid = true
          return
        }
        const tokenExp = state.session_authframe.exp * 1000
        const tokenExpLocale = new Date(tokenExp).toLocaleString()
        const now = new Date().getTime()

        verbosity(
          `TOKEN EXP => ${tokenExp} ${
            settings("session_noexpire") ? '( Infinite )' : `( ${tokenExpLocale} )`
          } || NOW => ${now}`
        )

        if (tokenExp < now) {
          state.session_valid = false
        }else{
          state.session_valid = true
        }
      }
    },
    handleLogin(state, { payload }){
      if (!payload) return false

      state.session_token = payload.access_token
      state.session_uuid = payload.user_id
      state.session_data = payload.user_data

      const sessionData = JSON.parse(payload.user_data)

      const frame = {
        session_uuid: payload.user_id,
        session_token: payload.access_token,
        avatar: sessionData.avatar,
        username: sessionData.username,
        attributes: {
          isAdmin: sessionData.admin,
          isDev: sessionData.dev,
          isPro: sessionData.is_pro
        }
       
      }

      jwt.sign(frame, state.server_key, (err, token) => {
        if (err) {
          verbosity(err)
          return false
        }
        cookie.set(app_config.session_token_storage, token)
        sessionStorage.setItem(app_config.session_data_storage, btoa(payload.user_data))
        state.session_authframe = token
      })

      state.session_valid = true
      location.reload()
    },
    handleUpdateData(state){
      const frame = {
        id: state.session_uuid,
        access_token: state.session_token,
        serverKey: state.server_key
      }
      user.get.data(frame, (err, res) => {
          if(err) {
            verbosity(err)
          }
          if (res) {
              try {
                const session_data = JSON.stringify(JSON.parse(res)["user_data"])
                sessionStorage.setItem(app_config.session_data_storage, btoa(session_data))
                location.reload()
              } catch (error) {
                verbosity(error)
              }
          }
      })
    },
    handleCollapseSidebar(state, { payload }){
      state.sidebar_collapsed = payload
    },
    handleUpdateTheme(state, { payload }) {
      verbosity(payload)
      store.set(app_config.appTheme_container, payload);
      state.app_theme = payload
    },
    isUser(state, { payload, callback }){
      if(!payload || !callback) return false
      switch (payload) {
        case 'login':{
          callback(state.session_valid)
          break;
        }
        case 'guest':{
          callback(!state.session_valid)
          break;
        }
        case 'dev':{
          if(state.session_data){
            return callback(state.session_data.dev? true : false)
          }
          return callback(false)
        }
        case 'embedded':{
          callback(state.electron? true : false)
          break;
        }
        default:{
          break;
        }
      }
    },
    ipcInvoke(state, {payload}){
      if (!payload || !state.embedded) {
        return false
      }
      const ipc = state.electron.ipcRenderer

      ipc.invoke(payload.key, payload.payload)
    },
    ipcSend(state, {payload}){
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
      cookie.remove(app_config.session_token_storage)
      sessionStorage.clear()
      location.reload()
    },
  },
};

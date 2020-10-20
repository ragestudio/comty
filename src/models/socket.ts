import store from 'store'
import { app_config } from 'config'
import keys from 'config/app_keys'
import { user, session } from 'core/models'
import { router, verbosity, appInterface } from 'core/libs'
import settings from 'core/libs/settings'
import { __legacy__objectToArray } from 'core'

import SocketConnection from 'core/libs/socket/index.ts'

import jwt from 'jsonwebtoken'
import cookie from 'cookie_js'

const defaultSocketAddress = "localhost:7000"

export default {
  namespace: 'socket',
  state: {
    resolvers: null,
    ioConn: null
  },
  subscriptions: {
    setup({ dispatch }) {
        dispatch({ type: 'query' })
    },
  },
  effects: {
    *query({ payload }, { call, put, select }) {
        const state = yield select(state => state)
        
        yield put({ type: "updateState", payload: { resolvers: state.app.resolvers } })

    },
    *initializeSocket({payload, then}, {select, put}){
        if(!payload) return false
        const state = yield select(state => state)
        const handleThen = () => {
          if (typeof(then) !== "undefined") {
            then(true)
          }
        }

        yield put({ 
          type: "handleSocket", 
          payload: new SocketConnection({payload, connector: state.app.dispatcher, then: handleThen })
        })
    },
  },
  reducers: {
    updateState(state, { payload }) {
      return {
        ...state,
        ...payload,
      };
    },
    handleSocket(state, { payload }) {
        console.log(payload.ioConn)
        state.ioConn = payload.ioConn

        state.ioConn.json = null // avoiding circular...
        state.ioConn.nsps = null
        state.ioConn.io.nsps = null
        state.ioConn.io.connecting = null
        //state.ioConn.io.opts.engine.transport = null
    },
  },
};

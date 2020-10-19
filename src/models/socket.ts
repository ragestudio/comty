import store from 'store'
import { app_config } from 'config'
import keys from 'config/app_keys'
import { user, session } from 'core/models'
import { router, verbosity, appInterface } from 'core/libs'
import settings from 'core/libs/settings'
import { __legacy__objectToArray } from 'core'

import { SocketConnection, SocketModel } from 'core/libs/socket/index.ts'

import jwt from 'jsonwebtoken'
import cookie from 'cookie_js'

const defaultSocketAddress = "localhost:7000"

export default {
  namespace: 'socket',
  state: {
    dispatcher: null,
    resolvers: null,
    socket_conn: null
  },
  subscriptions: {
    setup({ dispatch }) {
        dispatch({ type: 'updateState', payload: { dispatcher: dispatch } })
        dispatch({ type: 'query' })
    },
  },
  effects: {
    *query({ payload }, { call, put, select }) {
        const stateConnector = yield select(state => state)
        
        yield put({ type: "updateState", payload: { resolvers: stateConnector.app.resolvers } })

    },
    *initializeSocket({payload}, {select, put}){
        if(!payload) return false
        const stateConnector = yield select(state => state)

        yield put({ type: "handleSocket", payload: new SocketConnection({payload, connector: stateConnector.socket}) })
    },
  },
  reducers: {
    updateState(state, { payload }) {
        console.log(payload)
      return {
        ...state,
        ...payload,
      };
    },
    handleSocket(state, { payload }) {
        state.socket_conn = payload
        state.socket_opt = payload.opts
    },
  },
};

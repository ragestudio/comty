import store from 'store'
import { app_config } from 'config'
import keys from 'config/app_keys'
import { user, session } from 'core/models'
import { router, verbosity, appInterface } from 'core/libs'
import settings from 'core/libs/settings'
import { __legacy__objectToArray } from 'core'
import { Howl, Howler } from 'howler'

import SocketConnection from 'core/libs/socket/index.ts'

import jwt from 'jsonwebtoken'
import cookie from 'cookie_js'


export default {
  namespace: 'socket',
  state: {
    nodes: {},
    socket_address: app_config.endpoint_websocket, //set by default
    socket_port: "7000",
    headerNode: "/"
  },
  effects: {
    *createNodeSocket({ payload, then }, { select, put }) {
      const state = yield select(state => state)
      let opt = {
        namespaceOrigin: state.socket.headerNode,
        hostname: `${state.socket.socket_address}:${state.socket.socket_port}`, // set stated data
        port: state.socket.socket_port,
        reconnectionAttempts: 10
      }

      if (typeof (payload) !== "undefined") {
        opt = { ...opt, ...payload }
      }

      try {
        new SocketConnection({
          namespaceOrigin: opt.namespaceOrigin,
          connector: state.app.dispatcher,
          payload: opt,
          then: () => {
            if (typeof (then) !== "undefined") {
              return then(true)
            }
          }
        })
      } catch (error) {
        verbosity([error])
      }
    },
    *namespaceConnector({ namespace, node }, { select, put }) {
      if (!node || !namespace) {
        verbosity(`cannot connect to a namespace without declaring the namespace/node`)
        return false
      }
      const state = yield select(state => state.socket)
      state.nodes[node].namespaceConnector(`/${namespace}`)
    },
    *resetHeader({  }, { put }) {
      yield put({ type: "createNodeSocket" })
    },
    *use({ scope, invoke, query }, { put, select }) {
      const state = yield select(state => state)
      if (!scope || !invoke || !query) {
        verbosity(`some params is missing`)
        return false
      }
      if (!state.socket.nodes[scope] && scope !== state.socket.headerNode) {
        let opt = {
          namespaceOrigin: `/${scope}`,
          hostname: `${state.socket.socket_address}:${state.socket.socket_port}`,
          port: state.socket.socket_port,
          reconnectionAttempts: 10
        }

        new SocketConnection({
          namespaceOrigin: opt.namespaceOrigin,
          connector: state.app.dispatcher,
          payload: opt,
          then: (socket) => {
           socket._emit(invoke, query.payload, query.callback)
          }
        })
      }else{
        state.socket.nodes[scope].ioConn._emit(invoke, query.payload, query.callback)
      }
     
    },
    *break({ listener, node }, { select, put }) {
      if (!node || !listener) {
        verbosity(`cannot change a listener without declaring the node/listener`)
        return false
      }
      const state = yield select(state => state.socket)
      state.nodes[node].ioConn.updateListener(listener, false)
    },
    *resume({ listener, node }, { select, put }) {
      if (!node || !listener) {
        verbosity(`cannot change a listener without declaring the node/listener`)
        return false
      }
      const state = yield select(state => state.socket)
      state.nodes[node].ioConn.updateListener(listener, true)
    },
    *toogleListener({ listener, node }, { select, put }) {
      if (!node || !listener) {
        verbosity(`cannot change a listener without declaring the node/listener`)
        return false
      }
      const state = yield select(state => state.socket)
      state.nodes[node].ioConn.updateListener(listener)
    },
    *destroyNode({ node }, { select, put }) {
      if (!node) {
        verbosity(`cannot destroy a node without declaring it`)
        return false
      }
      const state = yield select(state => state.socket)
      if (state.nodes[node].connectionState !== "closed") {
        console.log("The node is not closed!, closing before destroying")
        state.nodes[node].ioConn._close()
      }
      let updated = {}

      __legacy__objectToArray(state.nodes).forEach(e => {
        if (e.key !== node) {
          updated[e.key] = e.value
        }
      })
  
      yield put({ type: "updateState", payload: { nodes: updated }  })
    },

  },
  reducers: {
    updateState(state, { payload }) {
      return {
        ...state,
        ...payload,
      };
    },
    updateStateFromSocket(state, { payload, node }) {
      state.nodes[node] = payload
    },
  },
};

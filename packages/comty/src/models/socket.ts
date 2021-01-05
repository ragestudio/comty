import { app } from 'config'
import { verbosity } from '@nodecorejs/utils'
import { objectToArrayMap } from 'core'

import SocketConnection from 'core/libs/socket/index.ts'

export default {
  namespace: 'socket',
  state: {
    nodes: {},
    socket_address: app.endpoint_websocket, //set by default
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
        verbosity.log(error)
      }
    },
    *namespaceConnector({ namespace, node }, { select, put }) {
      if (!node || !namespace) {
        verbosity.log(`cannot connect to a namespace without declaring the namespace/node`)
        return false
      }
      const state = yield select(state => state.socket)
      state.nodes[node].namespaceConnector(`/${namespace}`)
    },
    *resetHeader({  }, { put }) {
      yield put({ type: "createNodeSocket" })
    },
    *use({ scope, invoke, query, persistent, then }, { put, select }) {
      const state = yield select(state => state)
      if (!scope) {
        verbosity.log(`scope is missing`)
        return false
      }
      if (typeof(persistent) == "undefined" ) {
        persistent = false
      }
      if (!state.socket.nodes[scope] && scope !== state.socket.headerNode) {
        let opt = {
          namespaceOrigin: `/${scope}`,
          hostname: `${state.socket.socket_address}:${state.socket.socket_port}`,
          port: state.socket.socket_port,
          reconnectionAttempts: 10,
          forceNew: true
        }

        new SocketConnection({
          namespaceOrigin: opt.namespaceOrigin,
          connector: state.app.dispatcher,
          payload: opt,
          then: (socket) => {
            if (typeof(then) !== "undefined") {
              then(socket)
            }
            if (typeof(query) !== "undefined") {
              socket._emit(invoke, query.payload, (...callbacks) =>{
                new Promise((resolve, reject) => resolve(query.callback(...callbacks)) ).then(() => {
                  if (!persistent) {
                    socket.remove()
                  }
                })
              })
            }
          }
        })
      }else{
        state.socket.nodes[scope].ioConn._emit(invoke, query.payload, (callback) =>{
          query.callback(callback)
          state.socket.nodes[scope].ioConn.remove()
        })
      }
    },
    *break({ listener, node }, { select, put }) {
      if (!node || !listener) {
        verbosity.log(`cannot change a listener without declaring the node/listener`)
        return false
      }
      const state = yield select(state => state.socket)
      state.nodes[node].ioConn.updateListener(listener, false)
    },
    *resume({ listener, node }, { select, put }) {
      if (!node || !listener) {
        verbosity.log(`cannot change a listener without declaring the node/listener`)
        return false
      }
      const state = yield select(state => state.socket)
      state.nodes[node].ioConn.updateListener(listener, true)
    },
    *toogleListener({ listener, node }, { select, put }) {
      if (!node || !listener) {
        verbosity.log(`cannot change a listener without declaring the node/listener`)
        return false
      }
      const state = yield select(state => state.socket)
      state.nodes[node].ioConn.updateListener(listener)
    },
    *destroyNode({ node }, { select, put }) {
      if (!node) {
        verbosity.log(`cannot destroy a node without declaring it`)
        return false
      }
      const state = yield select(state => state.socket)
      if (state.nodes[node].connectionState !== "closed") {
        verbosity.log("The node is not closed!, closing before destroying")
        state.nodes[node].ioConn._close()
      }
      let updated = {}

      objectToArrayMap(state.nodes).forEach(e => {
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

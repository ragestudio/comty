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
    resolvers: null,
    socket_address: "85.251.59.39:7000", //set by default
    ioConn: null,
    listeners: {}
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
    *initializeSocket({ payload, then }, { select, put }) {
      const state = yield select(state => state)
      if (payload == null){
        payload = {
          hostname: state.socket.socket_address,
          reconnectionAttempts: 10
        }
      }

      const handleThen = () => {
        if (typeof (then) !== "undefined") {
          return then(true)
        }
      }
      appInterface.notify.proccess("Connecting to server")

      yield put({
        type: "handleSocket",
        payload: new SocketConnection({ payload, connector: state.app.dispatcher, then: handleThen })
      })
    },
    *break({ listener }, { select, put }) {
      const state = yield select(state => state.socket)
      state.ioConn.updateListener(listener, false)
    },
    *resume({ listener }, { select, put }) {
      const state = yield select(state => state.socket)
      state.ioConn.updateListener(listener, true)
    },
    *toogleListener({ listener }, { select, put }) {
      const state = yield select(state => state.socket)
      state.ioConn.updateListener(listener)
    },
    *getLatency({ payload }, { select, put }) {
      const state = yield select(state => state.socket)

      state.ioConn.emit('latency', Date.now(), (startTime) => {
        const latency = Date.now() - startTime
        console.log(latency)
      })
    
    },
    *floodTest({ ticks, offset }, { call, put, select }) {
      const state = yield select(state => state)

      if (ticks == null) {
        ticks = 300
      }

      const tickSound = new Howl({
        preload: true,
        html5: true,
        src: ["https://dl.ragestudio.net/tick.wav"]
      })

      const endSound = new Howl({
        preload: true,
        html5: true,
        src: ["https://dl.ragestudio.net/tickUp.wav"]
      })

      state.socket.ioConn._emit("floodTest", offset ?? Number(0)) // start flood

      state.socket.ioConn.on('floodTest', (e: any) => {
        const n = e + 1
        const canTick = n < (ticks + 1)

        verbosity([`floodTest (recived)=> ${e} | sending => ${n}`])
        if (canTick) {
          setTimeout(() => {
            state.socket.ioConn._emit("floodTest", n)
            tickSound.play()
          }, n)
        }else{
          endSound.play()
        }
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
      state.ioConn = payload.ioConn
    },
  },
};

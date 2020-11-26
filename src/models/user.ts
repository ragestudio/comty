import { effect, reducer, dvaModel, subscription, path, BaseModel } from 'dva-model-enhance'
import store from 'store'
import { app } from 'config'
import keys from 'config/app_keys'
import { user, session } from 'core/models'
import { router, verbosity, ui } from 'core/libs'
import settings from 'core/libs/settings'
import { DynamicSDCP } from 'core/libs/dynamicsdcp'
import * as core from 'core'

import jwt from 'jsonwebtoken'
import cookie from 'cookie_js'

export default {
  namespace: 'user',
  state: {
  },
  effects: {
    *actions({callback, payload}, { call, select }) {
      dispatch({
        type: "socket/use",
        scope: "users",
        invoke: "actions",
        query: {
          payload: {
            from: payload.from,
            user_id: payload.user_id ?? state.app.session_uuid,
            username: payload.username ?? state.app.session_authframe["username"],
            userToken: state.app.session_token
          },
          callback: (callbackResponse) => {
            return callback(callbackResponse)
          }
        }
      })
    },
    *get({ callback, payload }, { call, put, select }) {
      const dispatch = yield select(state => state.app.dispatcher)
      const state = yield select(state => state)

      if (!payload) {
        return callback({code: 115, response: "payload is missing/invalid"})
      }
      dispatch({
        type: "socket/use",
        scope: "users",
        invoke: "get",
        query: {
          payload: {
            from: payload.from,
            user_id: payload.user_id ?? state.app.session_uuid,
            username: payload.username ?? state.app.session_authframe["username"],
            userToken: state.app.session_token
          },
          callback: (callbackResponse) => {
            return callback(callbackResponse)
          }
        }
      })


    },
    *set({ payload }, { call, put, select }) {

    },
  },
  reducers: {
    updateState(state, { payload }) {
      return {
        ...state,
        ...payload,
      };
    }
  },
};

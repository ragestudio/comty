import { effect, reducer, dvaModel, subscription, path, BaseModel } from 'dva-model-enhance'
import store from 'store'
import { app_config } from 'config'
import keys from 'config/app_keys'
import { user, session } from 'core/models'
import { router, verbosity, appInterface } from 'core/libs'
import settings from 'core/libs/settings'
import { DynamicSDCP } from 'core/libs/dynamicsdcp'
import * as core from 'core'

import jwt from 'jsonwebtoken'
import cookie from 'cookie_js'

export default {
  namespace: 'user',
  state: {
    
  },
  subscriptions: {
    setup({ dispatch }) {
        dispatch({ type: 'query' })
    },
  },
  effects: {
    *query({ payload }, { call, put, select }) {
        const stateConnector = yield select(state => state)
        const { server_key, session_token, session_data, session_uuid, session_valid } = stateConnector.app
    
        yield put({ type: "updateState", payload: { server_key, session_uuid, session_token, session_data, session_valid } })
    },
    *get({ callback, req }, { call, put, select }) {
      const state = yield select(state => state.user)
  
      if (state.session_valid) {
        if (!req) {
          callback(120, "req params not valid data")
        }
        user.get[req.fetch]({username: req.username, server_key: state.server_key, access_token: state.session_token }, (err, res) => {
          if (err) {
            return console.log(err)
          }
          const data = res.user_data
          const frame = {
            avatar: data.avatar,
            can_follow: data.can_follow,
            country_id: data.contry_id,
            about: data.about,
            cover: data.cover,
            is_pro: data.is_pro,
            lastseen: data.lastseen,
            points: data.points, 
            registered:data.registered, 
            user_id: data.user_id, 
            verified: data.verified, 
            birthday: data.birthday, 
            details: data.details
          }
          return callback(false, frame)
        })
      }else{
        callback(403, "You need to be logged in to get this data")
      }
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


/* global window */
import { router } from 'utils'
import { stringify } from 'qs'
import store from 'store'
import { queryLayout, pathMatchRegexp } from 'utils'
import api from 'api'
import config from 'config'
import * as ycore from 'ycore'
import jwt from 'jsonwebtoken'
const { queryRouteList, logoutUser, queryUserInfo } = api

export default {
  namespace: 'app',
  state: {
    routeList: [
      {
        id: '1',
        icon: 'home',
        name: 'Main',
        router: '/Main',
      },
    ],
    locationPathname: '',
    AppSettings: store.get('app_settings') || config.defaultSettings,
    locationQuery: {},
    theme: store.get('theme') || 'light',
    notifications: [
      {
        title: 'Hey! Test notification',
        date: new Date(Date.now() - 50000000),
      },
    ],
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
    *query({payload}, { call, put, select }) {     
      const { locationPathname } = yield select(_ => _.app)
      const { list } = yield call(queryRouteList)
      let routeList = list
      yield put({type: 'updateState', payload: { routeList: list }, })
      
      const valid = ycore.ValidLoginSession();
      const validBackup = ycore.ValidBackup();
      if (valid == true) {
          if (pathMatchRegexp(['/', '/login'], window.location.pathname)) {
            router.push({pathname: '/main',})
            ycore.RefreshONCE()
          }
          // Runtime
          ycore.MakeBackup()
          ycore.UpdateSDCP()
        
      } 
      else if(!pathMatchRegexp(['/', '/login'], window.location.pathname)) {
          if (validBackup == true) {
            ycore.LogoutCall()
          } 
         else{
              router.push({pathname: '/login',})
              ycore.RefreshONCE()
          }
          
      }
    },

    *signOut({ payload }, { call, put }) {
      const data = yield call(logoutUser)
      if (data.success) {
        sessionStorage.clear() 
        yield put({ type: 'query' })
      } else {
        throw data
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


/* global window */
import { router } from 'utils'
import { stringify } from 'qs'
import store from 'store'
import { queryLayout, pathMatchRegexp } from 'utils'
import { CANCEL_REQUEST_MESSAGE } from 'utils/constant'
import api from 'api'
import config from 'config'
import Cookies from 'js-cookie'
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
    collapsed: store.get('collapsed') || true,
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
            value.cancel(CANCEL_REQUEST_MESSAGE)
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
      if ( valid == true) {
        if (pathMatchRegexp(['/', '/login'], window.location.pathname)) {
          router.push({pathname: '/main',})
          ycore.RefreshONCE()
        }else{
          ycore.MakeBackup()
          ycore.UpdateSDCP()
        }
      } else if (queryLayout(config.layouts, locationPathname) !== 'public') {
          if (validBackup == true) {
            ycore.LogoutCall()
            return
          }else if (ycore.GetUserToken == false){
              notification.open({
                placement: 'topLeft',
                message: 'Unexpectedly failed logout in YulioID™ ',
                description: 'It seems that your token has been removed unexpectedly and could not log out from YulioID ',
                icon: <Icon type="warning" style={{ color: 'orange' }} />
              })
              return
          }
          router.push({pathname: '/login',})
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

    handleCollapseChange(state, { payload }) {
      store.set('collapsed', payload)
      state.collapsed = payload
    },

    allNotificationsRead(state) {
      state.notifications = []
    },
  },
}

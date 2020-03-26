import { RenderFeed } from '../../../components/MainFeed'
import { transitionToogle } from '../../../pages/login'
import { SetControls, CloseControls } from '../../../components/Layout/Control'
import { SwapMode } from '../../../components/Layout/Secondary'
import * as ycore from 'ycore'
import * as antd from 'antd'
import * as Icons from '@ant-design/icons'
import React from 'react'

export function QueryRuntime() {
  const validBackup = ycore.validate.backup()

  if (!validBackup) ycore.make_data.backup()
}

export function SetupApp() {
  // TODO: Default sets
  ycore.notify.success('Authorised, please wait...')
  const resourceLoad = localStorage.getItem('resource_bundle')
  if (!resourceLoad) {
    localStorage.setItem('resource_bundle', 'light_ng')
  }
  setTimeout(() => {
    ycore.router.go('main')
  }, 500)
}

export const CheckThisApp = {
  desktop_mode: () => {
    const a = localStorage.getItem('desktop_src')
    if (a == 'true') {
      return true
    }
    return false
  },
}

export const SecondarySwap = {
  close: () => {
    SwapMode.close()
  },
  openPost: e => {
    SwapMode.openPost(e)
  },
  openSearch: e => {
    SwapMode.openSearch(e)
  }
}

export const ControlBar = {
  set: e => {
    SetControls(e)
  },
  close: () => {
    CloseControls()
  },
}

export const LoginPage = {
  transitionToogle: () => {
    transitionToogle()
  },
}

export function RefreshONCE() {
  window.location = '/'
}

export const app_session = {
  login: (callback, payload) => {
    if (!payload) {
      return false
    }
    const { EncUsername, EncPassword } = payload

    let username = atob(EncUsername)
    let password = atob(EncPassword)

    const containerpayload = { username, password }
    ycore.__rscloud.yulio_id.auth((err, res) => {
      if (err) {
        return false
      }
      try {
        var identState = JSON.parse(res)['api_status']
        if (identState == 200) {
          const UserID = JSON.parse(res)['user_id']
          const UserToken = JSON.parse(res)['access_token']

          ycore.__rscloud.sdcp_cloud.get(
            (err, res) => {
              if (err) {
                return false
              }

              let framepayload = { token: { UserID, UserToken }, sdcp: res }
              ycore.yconsole.log('FRAME  ', framepayload)

              ycore.__CTID_GEN((err, res) => {
                if (err) {
                  ycore.notify.error('Critical error, token declined!')
                  return false
                }
                ycore.SetupApp()
                callback(null, '200')
              }, framepayload)
            },
            { user_token: UserToken, user_id: UserID }
          )
        }
        if (identState == 400) {
          callback(null, '400')
        }
      } catch (error) {
        console.log(error)
        callback(true, '500')
        ycore.notify.error('Server bad response')
      }
    }, containerpayload)
  },
  logout: () => {
    ycore.__rscloud.yulio_id.logout((err, res) => {
      if (err) {
        return false
      }
      console.log(res)
      const api_state = JSON.parse(res)['api_status']
      ycore.yconsole.log(`Exit with => ${api_state}`)
      if (api_state == '404') {
        antd.notification.open({
          placement: 'topLeft',
          message: 'Unexpectedly failed logout in YulioID™ ',
          description:
            'It seems that your token has been removed unexpectedly and could not log out from YulioID ',
          icon: <Icons.WarningOutlined style={{ color: 'orange' }} />,
        })
        ycore.yconsole.log('Failed logout with YulioID™', res)
      } else {
        ycore.yconsole.log('Successful logout with YulioID™', res)
      }
      // Runtime after dispatch API
      ycore.token_data.remove()
      ycore.router.push({ pathname: '/login' })
    })
  },
}

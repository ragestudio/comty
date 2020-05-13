import { transitionToogle } from '../../../pages/login'
import { SetControls, CloseControls } from 'components/Layout/ControlBar'

import umiRouter from 'umi/router'
import * as app from 'app'
import * as antd from 'antd'
import * as Icons from 'components/Icons'
import React from 'react'

import { SwapMode } from 'components/Layout/Overlay'
import { RenderFeed } from 'components/MainFeed'
import { updateTheme } from '../../../layouts/PrimaryLayout'

export * from './modals.js'
export * from './notify.js'

export {SwapMode} 
export {RenderFeed}

export const ControlBar = {
  set: e => {
    SetControls(e)
  },
  close: () => {
    CloseControls()
  },
}

export const router = {
  go: e => {
    goTo.element('primaryContent')
    umiRouter.push({
      pathname: `/${e}`,
      search: window.location.search,
    })
  },
  push: e => {
    umiRouter.push({
      pathname: `/${e}`,
      search: window.location.search,
    })
  },
  goprofile: () => {
    goTo.element('primaryContent')
    umiRouter.push({
      pathname: `/@${app.userData().username}`,
      search: window.location.search,
    })
  }
}

export const goTo = {
  top: (id)=> {
    const element = document.getElementById(id)
    element.scrollTop = element.scrollHeight + element.clientHeight
  },
  bottom: (id) => {
    const element = document.getElementById(id)
    element.scrollTop = element.scrollHeight - element.clientHeight
  },
  element: (element) => {
    try {
      document.getElementById(element).scrollIntoView()
    } catch (error) {
      console.debug(error)
      return false
    }
  }

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
    app.yulio_id.auth((err, res) => {
      if (err) {
        return false
      }
      try {
        var identState = JSON.parse(res)['api_status']
        if (identState == 200) {
          const UserID = JSON.parse(res)['user_id']
          const UserToken = JSON.parse(res)['access_token']

          const preframepayload = { user_token: UserToken, user_id: UserID}
          app.yulio_id.getData(
            (err, res) => {
              if (err) {
                return false
              }

              let framepayload = { token: { UserID, UserToken }, sdcp: res }
              app.yconsole.log('FRAME  ', framepayload)

              app.__CTID_GEN((err, res) => {
                if (err) {
                  app.notify.error('Critical error, token declined!')
                  return false
                }
                app._app.setup()
                callback(null, '200')
              }, framepayload)
            },
            preframepayload
          )
        }
        if (identState == 400) {
          callback(null, '400')
        }
      } catch (error) {
        console.log(error)
        callback(true, '500')
        app.notify.error('Server bad response')
      }
    }, containerpayload)
  },
  logout: () => {
    app.yulio_id.logout((err, res) => {
      if (err) {
        return false
      }
      console.log(res)
      const api_state = JSON.parse(res)['api_status']
      app.yconsole.log(`Exit with => ${api_state}`)
      if (api_state == '404') {
        antd.notification.open({
          placement: 'topLeft',
          message: 'Unexpectedly failed logout in YulioID™ ',
          description:
            'It seems that your token has been removed unexpectedly and could not log out from YulioID ',
          icon: <Icons.WarningOutlined style={{ color: 'orange' }} />,
        })
        app.yconsole.log('Failed logout with YulioID™', res)
      } else {
        app.yconsole.log('Successful logout with YulioID™', res)
      }
      // Runtime after dispatch API
      app.token_data.remove()
      app.router.push('login')
    })
  },
}

export const app_theme = {
  getString: () => {
    return localStorage.getItem('theme_style')
  },
  set: (data, process) => {
    if (!data){
      return false
    }
    let newdata = []
    if(process){
      let style = data
      let mix = []
      try {
        style[key] = value
        const obj = Object.entries(style)
        obj.forEach((e) => {
            mix.push({key: e[0], value: e[1]})
        })
        newdata = JSON.stringify(mix)
      } catch (error) {
        console.log(error)
        return false
      }
    }else{
      newdata = data
    }
    
    localStorage.setItem('theme_style', newdata)
    app_theme.update()
  },
  getStyle: () => {
    let final = {}
    const storaged = localStorage.getItem('theme_style')
    if (storaged) {
      try {
        let scheme = JSON.parse(storaged)
        scheme.forEach((e)=>{
          final[e.key] = e.value
        })
      } catch (error) {
        console.log(error)
      }
    }
    return final
  },
  update: () => {
    return updateTheme(app_theme.getStyle())
  }
}
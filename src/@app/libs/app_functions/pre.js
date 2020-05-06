import { RenderFeed } from 'components/MainFeed'
import { transitionToogle } from '../../../pages/login'
import { SetControls, CloseControls } from '../../../components/Layout/Control'
import { SwapMode } from '../../../components/Layout/Secondary'
import umiRouter from 'umi/router'
import * as app from 'app'
import * as antd from 'antd'
import * as Icons from '@ant-design/icons'
import React from 'react'

export * from './modals.js'

export {SwapMode} 

export function SetupApp() {
  // TODO: Default sets
  app.notify.success('Authorised, please wait...')
  const resourceLoad = localStorage.getItem('resource_bundle')
  if (!resourceLoad) {
    localStorage.setItem('resource_bundle', 'light_ng')
  }
  setTimeout(() => {
    app.router.push('main')
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
  },
  openFragment: e =>{
    SwapMode.openFragment(e)
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

export const FeedHandler = {
  refresh: () => {
    RenderFeed.RefreshFeed()
  },
  killByID: (post_id) => {
    RenderFeed.killByID(post_id)
  },
  addToRend: (payload) => {
    RenderFeed.addToRend(payload)
  },
  goToElement: post_id => {
    RenderFeed.goToElement(post_id)
  },
  sync: data => {
    RenderFeed.sync(data)
  }
}

export const LoginPage = {
  transitionToogle: () => {
    transitionToogle()
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


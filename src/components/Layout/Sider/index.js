import React from 'react'
import config from 'config'
import * as app from 'app'
import MenuList from 'globals/sidebar_menu'

import Sider_Mobile from './mobile.js'
import Sider_Default from './default.js'

class Sider extends React.PureComponent {
  
  handleClickMenu = e => {
    e.key === 'messages' && app.router.go('messages')
    e.key === 'SignOut' && app.app_session.logout()
    e.key === 'general_settings' && app.router.go('settings')
    e.key === 'profile' && app.router.goprofile()
    e.key === 'saves' && app.router.go('saves')
    e.key === 'main' && app.router.go('main')
    e.key === 'explore' && app.router.go('explore')
    e.key === 'notifications' && app.router.go('notifications')
    e.key === 'debug_area' && app.router.go('debug')
  }

  render() {
    const { isMobile, theme } = this.props
    const sider_props = {theme: theme, menus: MenuList, handleClickMenu: this.handleClickMenu ,logo: config.LogoPath, menulist: null, userData: this.props.userData}
  
    if (isMobile) {
      return <Sider_Mobile {...sider_props} />
    }
    return <Sider_Default {...sider_props} />
  }
}

export default Sider

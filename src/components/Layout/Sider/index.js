import React from 'react'
import config from 'config'
import * as app from 'app'

import Sider_Mobile from './mobile.js'
import Sider_Default from './default.js'

class Sider extends React.PureComponent {
  
  onClickFunctions = {
    saves: (e) => {
      this.setState({selectedKey: e})
      app.router.go('saves')  
    },
    events: (e) => {
     this.setState({selectedKey: e})
     app.router.go('events')
    },
    marketplace: (e) => {
      this.setState({selectedKey: e})
      app.router.go('marketplace') 
    },
    explore: (e) => {
      this.setState({selectedKey: e})
      app.router.go('main') 
    },
    chats: (e) => {
      this.setState({selectedKey: e})
      app.router.go('chats')
    }
  }

  handleClickMenu = e => {
    e.key === 'chats' && this.onClickFunctions.chats(e.key)
    e.key === 'SignOut' && app.app_session.logout()
    e.key === 'general_settings' && app.router.go('settings')
    e.key === 'profile' && app.router.goprofile()
    e.key === 'saves' && this.onClickFunctions.saves(e.key)
    e.key === 'events' && this.onClickFunctions.events(e.key)
    e.key === 'marketplace' && this.onClickFunctions.marketplace(e.key)
    e.key === 'explore' && this.onClickFunctions.explore(e.key)
    e.key === 'debug_area' && app.router.go('__m')
  }

  render() {
    const { isMobile } = this.props
    const sider_props = {handleClickMenu: this.handleClickMenu ,logo: config.LogoPath, menulist: null, userData: this.props.userData}

    if (isMobile) {
      return <Sider_Mobile {...sider_props} />
    }
    return <Sider_Default {...sider_props} />
  }
}

export default Sider

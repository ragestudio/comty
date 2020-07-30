import React from 'react'
import { app_config } from 'config'
import { router } from 'core/cores'
import MenuList from 'globals/sidebar_menu'

import Sider_Mobile from './mobile'
import Sider_Default from './default'

class Sider extends React.PureComponent {

  handleClickMenu = e => {
    router.go(`/${e.key}`)
  }

  render() {
    const { isMobile } = this.props
    const sider_props = { menus: MenuList, handleClickMenu: this.handleClickMenu, logo: app_config.LogoPath }

    return isMobile? <Sider_Mobile {...sider_props} /> : <Sider_Default {...sider_props} />
  }
}

export default Sider

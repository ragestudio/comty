import React from 'react'
import * as antd from 'antd'
import * as Icons from 'components/Icons'

import Icon from '@ant-design/icons'

import { withI18n, Trans } from '@lingui/react'
import styles from './default.less'
import * as app from 'app'
import classnames from 'classnames'

@withI18n()
export default class Sider_Default extends React.PureComponent {
  state = {
    loading: true,
    menus: null
  }

  require(e){
    switch (e) {
      case 'login':
        return true
      case 'admin':
        return true
      default:
        return true
    }
  }

  componentDidMount(){
    try {
      let tmp = [];
      const { menus } = this.props
      menus.forEach(e => {
        if (this.require(e.require)) {
          tmp.push(e)
        }
      });
      this.setState({ menus: tmp, loading: false })
    } catch (error) {
      console.log(error)

    }
  }

  renderMenus(data){
    try {
      return data.map(e => {
        return(
          <antd.Menu.Item key={e.id}>
          {e.icon}
          <Trans>
            <span>{e.title}</span>
          </Trans>
        </antd.Menu.Item>
        )
      })
    } catch (error) {
      console.log(error)
      return null
    }
  }

  render() {
    const { handleClickMenu, logo, theme } = this.props
    const predominantColor = theme.predominantColor || "#333"

    if (this.state.loading) return <div>Loading</div> 
    return (
      <div className={styles.left_sider_wrapper}>
        <antd.Layout.Sider
          trigger={null}
          className={styles.left_sider_container}
          style={{ flex:'unset', maxWidth: 'unset', minWidth: '200px', width: '100%'}}
        >
          <div className={styles.left_sider_brandholder}>
            <img
              onClick={() => app.router.go('main')}
              src={logo}
            />
          </div>
         
          <div className={styles.left_sider_menuContainer}>
           
              <antd.Menu
                // style={{color: predominantColor}}
                //className={classnames(styles.left_sider_menuItems, {[styles.matchColor]: theme.predominantColor? true : false})}
                selectable={true}
                className={styles.left_sider_menuItems}
                mode="vertical"
                onClick={handleClickMenu}
              >
                {this.renderMenus(this.state.menus)}

              </antd.Menu>

              <div className={styles.something_thats_pulling_me_down}>
                <antd.Menu
                  selectable={false}
                  className={styles.left_sider_menuItems}
                  mode="vertical"
                  onClick={handleClickMenu}
                 
                >
                  <antd.Menu.Item key="general_settings">
                    <Icons.SettingOutlined />
                    <Trans>
                      <span>Settings</span>
                    </Trans>
                  </antd.Menu.Item>
                  {app.IsThisUser.dev() ? (
                    <antd.Menu.Item key="debug_area">
                      <Icons.ThunderboltOutlined />
                      <span>Debug</span>
                    </antd.Menu.Item>
                  ) : (
                    undefined
                  )}

                  <antd.Menu.Item key="SignOut">
                    <Icons.LogoutOutlined style={{ color: 'red' }} />
                     <Trans>
                       <span>Logout</span>
                     </Trans>
                  </antd.Menu.Item>

                </antd.Menu>
              </div>
   
          </div>
        </antd.Layout.Sider>
      </div>
    )
  }
}

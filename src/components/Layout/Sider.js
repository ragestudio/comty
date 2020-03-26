import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import * as antd from 'antd'
import * as Icons from '@ant-design/icons'
import Icon from '@ant-design/icons'

import { withI18n, Trans } from '@lingui/react'
import { config } from 'utils'
import styles from './Sider.less'
import * as ycore from 'ycore'
import router from 'umi/router'
import CustomIcons from '../CustomIcons'

@withI18n()
class Sider extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      selectedKey: '',
      isHover: false,
      collapsedWidth: '70',
    }
  }

  isSelected(key){
    if (this.state.selectedKey == (key)) {
      return true
    }
    return false
  }
  
  onClickFunctions = {
    saves: (e) => {
      this.setState({selectedKey: e})
      ycore.router.go('saves')  
    },
    events: (e) => {
     this.setState({selectedKey: e})
     ycore.router.go('events')
    },
    marketplace: (e) => {
      this.setState({selectedKey: e})
      ycore.router.go('marketplace') 
    },
    explore: (e) => {
      this.setState({selectedKey: e})
      ycore.router.go('main') 
    },
  }

  handleClickMenu = e => {
    e.key === 'SignOut' && ycore.app_session.logout()
    e.key === 'general_settings' && ycore.router.go('settings')
    e.key === 'saves' && this.onClickFunctions.saves(e.key)
    e.key === 'events' && this.onClickFunctions.events(e.key)
    e.key === 'marketplace' && this.onClickFunctions.marketplace(e.key)
    e.key === 'explore' && this.onClickFunctions.explore(e.key)
    e.key === 'debug_area' && ycore.router.go('__m')
  }

  render() {
    return (
      <div className={styles.left_sider_wrapper}>
        <antd.Layout.Sider
          trigger={null}
          collapsed
          width="90"
          className={styles.left_sider_container}
        >
          <div className={styles.left_sider_brandholder}>
            <img
              onClick={() => ycore.router.go('main')}
              src={config.LogoPath}
            />
          </div>
         
          <div className={styles.left_sider_menuContainer}>
           
              <antd.Menu
                selectable={false}
                className={styles.left_sider_menuItems}
                mode="vertical"
                onClick={this.handleClickMenu}
              >
                <antd.Menu.Item key="explore">
                  <Icons.CompassTwoTone twoToneColor={this.isSelected('explore')? "#28c35d" : "#85858570"} />
                  <Trans>
                    <span>Explore</span>
                  </Trans>
                </antd.Menu.Item>

                <antd.Menu.Item key="saves">
                  <Icon component={this.isSelected('saves')? CustomIcons.SavedPostColor : CustomIcons.SavedPostGrey} />
                  <Trans>
                    <span>Saves</span>
                  </Trans>
                </antd.Menu.Item>

               
                <antd.Menu.Item key="marketplace">
                  <Icons.ShoppingTwoTone twoToneColor={this.isSelected('marketplace')? "#ff7a45" : "#85858570" }/>
                  <Trans>
                    <span>Marketplace</span>
                  </Trans>
                </antd.Menu.Item>
         

              <antd.Menu.Item key="events">
                  <Icons.CarryOutTwoTone twoToneColor={this.isSelected('events')? "#ff4d4f" : "#85858570"}/>
                  <Trans>
                    <span>Events</span>
                  </Trans>
              </antd.Menu.Item>

              </antd.Menu>

              <div className={styles.something_thats_pulling_me_down}>
                <antd.Menu
                  selectable={false}
                  className={styles.left_sider_menuItems}
                  mode="vertical"
                  onClick={this.handleClickMenu}
                >
                  <antd.Menu.Item key="general_settings">
                    <Icons.SettingOutlined />
                    <Trans>
                      <span>Settings</span>
                    </Trans>
                  </antd.Menu.Item>
                  {ycore.IsThisUser.dev() ? (
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

Sider.propTypes = {
  menus: PropTypes.array,
  theme: PropTypes.string,
  isMobile: PropTypes.bool,
  collapsed: PropTypes.bool,
  onThemeChange: PropTypes.func,
  onCollapseChange: PropTypes.func,
}

export default Sider

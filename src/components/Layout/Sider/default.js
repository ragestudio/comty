import React from 'react'
import * as antd from 'antd'
import * as Icons from '@ant-design/icons'
import Icon from '@ant-design/icons'

import { withI18n, Trans } from '@lingui/react'
import styles from './default.less'
import * as ycore from 'ycore'
import CustomIcons from '../../CustomIcons'

@withI18n()
export default class Sider_Default extends React.PureComponent {
  render() {
    const { handleClickMenu, logo } = this.props 
    return (
      <div className={styles.left_sider_wrapper}>
        <antd.Layout.Sider
          trigger={null}
          collapsed
          collapsedWidth='80'
          className={styles.left_sider_container}
        >
          <div className={styles.left_sider_brandholder}>
            <img
              onClick={() => ycore.router.go('main')}
              src={logo}
            />
          </div>
         
          <div className={styles.left_sider_menuContainer}>
           
              <antd.Menu
                selectable={false}
                className={styles.left_sider_menuItems}
                mode="vertical"
                onClick={handleClickMenu}
              >
                <antd.Menu.Item key="explore">
                  <Icons.CompassTwoTone twoToneColor={"#28c35d"} />
                  <Trans>
                    <span>Explore</span>
                  </Trans>
                </antd.Menu.Item>

                <antd.Menu.Item key="saves">
                  <Icon component={CustomIcons.SavedPostColor} />
                  <Trans>
                    <span>Saves</span>
                  </Trans>
                </antd.Menu.Item>

               
                <antd.Menu.Item key="marketplace">
                  <Icons.ShoppingTwoTone twoToneColor={"#ff7a45"}/>
                  <Trans>
                    <span>Marketplace</span>
                  </Trans>
                </antd.Menu.Item>
         

              <antd.Menu.Item key="events">
                  <Icons.CarryOutTwoTone twoToneColor={"#ff4d4f"}/>
                  <Trans>
                    <span>Events</span>
                  </Trans>
              </antd.Menu.Item>

              </antd.Menu>

              <div className={styles.something_thats_pulling_me_down}>
                <antd.Menu
                  selectable={false}
                  className={styles.left_sider_menuItems}
                  mode="horizontal"
                  onClick={handleClickMenu}
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

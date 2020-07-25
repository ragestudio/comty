import React from 'react'
import * as antd from 'antd'
import * as Icons from 'components/Icons'
import styles from './index.less'

export default class Sider_Default extends React.PureComponent {
  state = {
    loading: true,
    menus: null
  }

  componentDidMount(){
    this.setState({ menus: this.props.menus, loading: false })
  }

  renderMenus(data){
    return data.map(e => {
      return(
        <antd.Menu.Item key={e.id}>
        {e.icon}
        <span>{e.title}</span>
      </antd.Menu.Item>
      )
    })
  }

  render() {
    const { handleClickMenu, logo } = this.props
    return this.state.loading? null : (
      <div className={styles.left_sider_wrapper}>
        <antd.Layout.Sider
          trigger={null}
          className={styles.left_sider_container}
          style={{ flex:'unset', maxWidth: 'unset', minWidth: '200px', width: '100%'}}
        >
          <div className={styles.left_sider_brandholder}>
            <img
              onClick={() => handleClickMenu({key: '/'})}
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
                  <antd.Menu.Item key="settings">
                    <Icons.SettingOutlined />
                      <span>Settings</span>
                  </antd.Menu.Item>

                  <antd.Menu.Item key="logout">
                    <Icons.LogoutOutlined style={{ color: 'red' }} />
                       <span>Logout</span>
                  </antd.Menu.Item>
                </antd.Menu>
              </div>
          </div>
        </antd.Layout.Sider>
      </div>
    )
  }
}

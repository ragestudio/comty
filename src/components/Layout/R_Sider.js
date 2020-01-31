import React, { PureComponent, StrictMode } from 'react'
import PropTypes from 'prop-types'
import { Icon, Switch, Layout, Tag, Divider, Drawer, Avatar, Menu} from 'antd'
import { withI18n, Trans } from '@lingui/react'
import classNames from 'classnames'
import router from 'umi/router'
import { SDCP, LogoutCall, DevOptions} from 'ycore'

import styles from './R_Sider.less'

let userData = SDCP()

@withI18n()
class R_Sider extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isHover: false
    };
      this.hover = this.hover.bind(this);
  }
  hover(e) {
    this.setState({
      isHover: !this.state.isHover
    });
  }
  handleClickMenu = e => {
    e.key === 'SignOut' && LogoutCall()
    e.key === 'settingpage' && router.push('/settings')
    e.key === 'accountpage' && router.push('/account')
  }
  Balancer() {
    const { collapsed,  } = this.props;
    const { isHover } = this.state;
    if (collapsed == false) {
      return false
    }
    if (isHover == false ){
      if (collapsed == true) {
        return true
      }
      return true
    }else{
      return false
    }
   
  }
  StrictMode = () =>{
    const { theme } = this.props;
    if (DevOptions.StrictLightMode == false) {
      return "dark"
    }
    if (DevOptions.StrictLightMode == true && theme == "light") {
      return "light"
    }
    if (DevOptions.StrictLightMode == true && theme == "dark") {
      return "dark"
    }
  }
  render() {
    const { theme, onThemeChange} = this.props;
   
    return (
      <div className={styles.siderwrapper}> 
          <Layout.Sider  
            collapsedWidth="30"
            theme={this.StrictMode()}
            width="140"
            collapsed={this.Balancer()}
            className={styles.sider}
            style={this.Balancer()? {backgroundColor: 'rgba(0, 0, 0, 0.1)'} : null}
            onMouseEnter={this.hover} 
            onMouseLeave={this.hover}
          >
           
            <div className={styles.siderhead}>
              <Avatar size={this.Balancer()? "small" : "large"} shape={this.Balancer()? "circle" : "square"} src={userData.avatar} className={styles.avatar} />
              {this.Balancer()? null : <span>{userData.username}</span>}
            </div>
           {this.Balancer()? <div style={{ height: "100%", textAlign: "center" }} ><Icon onClick={this.hover} type="left" style={{ color: "#2F2E30", position: "absolute", bottom: "50%" }} /></div> :
            <div className={styles.sidercontainer}>
                  <Menu className={styles.menuItems} mode="vertical" onClick={this.handleClickMenu}>
                      <Menu.Item key="accountpage">
                        <Icon type="idcard" />
                        <Trans>Account</Trans>
                      </Menu.Item>
                      <Menu.Item key="settingpage">
                        <Icon type="setting" />
                        <Trans>Settings</Trans>
                      </Menu.Item>
                      <Menu.Item key="LightMode" disabled={false}>
                        <Icon type="bg-colors" />
                        <Switch
                          onChange={onThemeChange.bind(
                            this,
                            theme === 'light' ? 'dark' : 'light'
                          )}
                          checkedChildren="Dark"
                          unCheckedChildren="Light"
                          defaultChecked={theme === 'dark'}
                        />
                      </Menu.Item>
                      <Menu.Item key="SignOut" className={styles.SignOut} >
                        <Icon type="logout" style={{ color: 'red' }} />
                        <Trans>Logout</Trans>
                      </Menu.Item>
                  </Menu>
            </div>
            }
          </Layout.Sider>
      </div>
    )
  }
}

R_Sider.propTypes = {
  menus: PropTypes.array,
  theme: PropTypes.string,
  isMobile: PropTypes.bool,
  collapsed: PropTypes.bool,
  onThemeChange: PropTypes.func,
  onCollapseChange: PropTypes.func,
}

export default R_Sider

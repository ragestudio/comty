import React, { PureComponent, StrictMode } from 'react'
import PropTypes from 'prop-types'
import { Icons as LegacyIcon } from '@ant-design/compatible';
import * as icon from '@ant-design/icons';
import { Switch, Layout, Tag, Divider, Drawer, Avatar, Menu } from 'antd';
import { withI18n, Trans } from '@lingui/react'
import classNames from 'classnames'
import router from 'umi/router'
import { SDCP, LogoutCall, DevOptions} from 'ycore'

import styles from './R_Sider.less'
import ycstyle from 'ycstyle'

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
  UserIsPro(){
    if (userData.is_pro == 1){
      return true
    }
    return false
  }
  UserIsAdmin(){
    if (userData.admin == 1){
      return true
    }
    return false
  }
  render() {
    
    const { theme, onThemeChange} = this.props;
   
    return (
      <div className={styles.siderwrapper}> 
          <Layout.Sider  
            collapsedWidth="30"
            theme={this.StrictMode()}
            width="180"
            collapsed={this.Balancer()}
            className={styles.sider}
            style={this.Balancer()? {backgroundColor: 'rgba(0, 0, 0, 0.1)'} : null}
            onMouseEnter={this.hover} 
            onMouseLeave={this.hover}
          >
           
            <div className={styles.siderhead}>
              <Avatar size={this.Balancer()? "small" : "large"} shape={this.Balancer()? "circle" : "square"} src={userData.avatar} className={this.Balancer()? styles.avatar : styles.avatarFull} />
            </div>
           {this.Balancer()? <div style={{ height: "100%", textAlign: "center" }} ><LegacyIcon onClick={this.hover} type="left" style={{ color: "#2F2E30", position: "absolute", bottom: "50%" }} /></div> :
            <div>
                <div className={styles.userInfo}>
                    <h2>@{userData.username}</h2>
                    <span>Points:  {userData.points} </span>
                </div>
                <Divider dashed style={{margin: '10px 0 2px 0', borderWidth: '0.8px 0 0.8px 0', letterSpacing: '0.6px'}} />
                <div className={styles.sidercontainer}>
                      <Menu className={styles.menuItems} mode="vertical" onClick={this.handleClickMenu}>
                          {this.UserIsPro()? 
                          <Menu.Item key="boosted_pages">
                            <LegacyIcon style={{ fontSize: '15px' }} type="thunderbolt" />
                            <Trans> Boosted Posts </Trans>
                          </Menu.Item> 
                          : 
                        <Menu.Item key="upgrade_pro">
                          <LegacyIcon style={{ fontSize: '15px' }} type="star" />
                          <Trans> Upgrade to Pro </Trans>
                        </Menu.Item>}
                          <Menu.Item key="edit_profile">
                            <LegacyIcon style={{ fontSize: '15px' }} type="profile" />
                            <Trans>Edit Profile</Trans>
                          </Menu.Item>
                          <Menu.Item key="general_settings">
                            <LegacyIcon style={{ fontSize: '15px' }} type="setting" />
                            <Trans>General Settings</Trans>
                          </Menu.Item>
                          <Divider dashed style={{margin: '0 0 0 0', borderWidth: '1px 0 1px 0', letterSpacing: '0.6px'}} />
                          {this.UserIsAdmin()? 
                            <Menu.Item key="admin_area">
                              <LegacyIcon style={{ fontSize: '15px' }} type="tool" />
                              <Trans>Admin Area</Trans>
                            </Menu.Item> 
                                : 
                            undefined
                          }
                        </Menu>
                        
                       
                        <div className={styles.something_thats_pulling_me_down}>
                        <Menu className={styles.menuItems} mode="vertical" onClick={this.handleClickMenu}>
                            <Menu.Item style={{ fontSize: '15px' }} key="LightMode" disabled={false} >
                              <LegacyIcon type="bg-colors" />
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
                            <Menu.Item key="SignOut">
                              <LegacyIcon type="logout" style={{ color: 'red' }} />
                              <Trans>Logout</Trans>
                            </Menu.Item>
                        </Menu>
                    </div>
                </div>
            </div>
            }
          </Layout.Sider>
      </div>
    );
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

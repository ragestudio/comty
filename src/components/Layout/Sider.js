import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import * as antd from 'antd'
import { withI18n, Trans } from '@lingui/react'
import ScrollBar from '../ScrollBar'
import { config } from 'utils'
import styles from './Sider.less'
import * as ycore from 'ycore';
import router from 'umi/router';
import {CustomIcons} from 'components'


const userData = ycore.SDCP()

@withI18n()
class Sider extends PureComponent {
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
    if (ycore.DevOptions.StrictLightMode == false) {
      return "dark"
    }
    return theme
  }


  handleClickMenu = e => {
    e.key === 'SignOut' && ycore.LogoutCall()
    e.key === 'settingpage' && router.push('/settings')
    e.key === 'accountpage' && router.push('/account')
  }
  isDarkMode(){
    const { theme } = this.props
    if (theme == 'dark'){
      return true
    }
    return false
  }

  render() {
    const {
      i18n,
      menus,
      theme,
      isMobile,
      collapsed,
      onThemeChange,
      onCollapseChange,
    } = this.props
    
    return (
      <div className={styles.siderwrapper}> 
      <antd.Layout.Sider
        breakpoint="lg"
        trigger={null}
        collapsible
        defaultCollapsed="false"
        onBreakpoint={isMobile ? null : onCollapseChange}
        collapsedWidth={this.Balancer()? "35" : "90"}
        theme={this.StrictMode()}
        width="180"
        collapsed={collapsed || false}
        className={classnames(styles.sider, {[styles.darkmd]: this.isDarkMode()} )}
        onMouseEnter={this.hover} 
        onMouseLeave={this.hover}
      >
        <div className={styles.brand}><img onClick={() => ycore.crouter.native('main')} src={collapsed? config.LogoPath  : config.FullLogoPath } /></div>
        <div className={this.StrictMode()? styles.CollapserWrapperLight : styles.CollapserWrapperDark} ><antd.Button width={'20px'} onClick={() => onCollapseChange(!collapsed)} icon={collapsed? (this.Balancer()? "right" : "double-right") : (this.Balancer()? "left" : "double-left") } /></div> 
        <div className={styles.menuContainer}>
          <ScrollBar
            options={{
              // Disabled horizontal scrolling, https://github.com/utatti/perfect-scrollbar#options
              suppressScrollX: true,
            }}
          >
                <antd.Menu selectable={false} className={collapsed? styles.menuItemsCollapsed : styles.menuItems} mode="vertical" onClick={this.handleClickMenu}>
                      {ycore.booleanFix(userData.is_pro)? 
                      <antd.Menu.Item key="boosted_pages">
                        <antd.Icon style={{ fontSize: '15px' }} type="thunderbolt" />
                        {collapsed ?  null : <Trans> Boosted Posts </Trans> }
                      </antd.Menu.Item> 
                      : 
                    <antd.Menu.Item key="upgrade_pro">
                      <antd.Icon style={{ fontSize: '15px' }} type="star" />
                      {collapsed ?  null : <Trans> Upgrade to Pro </Trans>}
                    </antd.Menu.Item>}
                      <antd.Menu.Item key="edit_profile">
                        <antd.Icon style={{ fontSize: '15px' }} type="profile" />
                        {collapsed ?  null : <Trans>Edit Profile</Trans>}
                      </antd.Menu.Item>
                      <antd.Menu.Item key="general_settings">
                        <antd.Icon style={{ fontSize: '15px' }} type="setting" />
                        {collapsed ?  null : <Trans>General Settings</Trans>}
                      </antd.Menu.Item>
                      {ycore.booleanFix(userData.admin)? 
                        <antd.Menu.Item key="admin_area">
                          <antd.Icon style={{ fontSize: '15px' }} type="tool" />
                          {collapsed ?  null : <Trans>Admin Area</Trans>}
                        </antd.Menu.Item> 
                            : 
                        undefined
                      }
                    </antd.Menu>
                   
                    <div className={styles.something_thats_pulling_me_down}>
                    <antd.Menu selectable={false} className={collapsed ?  styles.menuItemsCollapsed : styles.menuItems} mode="vertical" onClick={this.handleClickMenu}>
                        <antd.Menu.Item style={{ fontSize: '15px' }} key="LightMode" disabled={false} >
                        {collapsed? <antd.Icon type="bulb" /> :
                            <div className={styles.themeSwitcher}>
                              <antd.Switch
                                onChange={onThemeChange.bind(
                                  this,
                                  theme === 'light' ? 'dark' : 'light'
                                )}
                                checkedChildren={<CustomIcons.MoonSVG style={{ vertialAlign: 'middle'}} />}
                                unCheckedChildren={<CustomIcons.SunSVG style={{ vertialAlign: 'middle'}}/>}
                                defaultChecked={theme === 'dark'}
                              />
                            </div>}
                        </antd.Menu.Item>
                        <antd.Menu.Item key="SignOut">
                          <antd.Icon type="logout" style={{ color: 'red' }} />
                         {collapsed ?  null : <Trans>Logout</Trans>}
                        </antd.Menu.Item>
                    </antd.Menu>
                    <div className={styles.siderhead}>
                      <antd.Avatar size={collapsed? "small" : "large"} shape={collapsed? "circle" : "square"} src={userData.avatar} className={collapsed? styles.avatar : styles.avatarFull} />
                    </div>  
                    {collapsed? null : <div className={styles.userInfo}><a onClick={() => ycore.crouter.native(`@${userData.username}`)} ><h2>@{userData.username}</h2></a></div> }
                </div>
            </ScrollBar>
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

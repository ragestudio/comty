import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import * as antd from 'antd'
import * as Icons from '@ant-design/icons';
import Icon from '@ant-design/icons'

import { withI18n, Trans } from '@lingui/react'
import ScrollBar from '../ScrollBar'
import { config } from 'utils'
import styles from './Sider.less'
import * as ycore from 'ycore';
import router from 'umi/router';
import {CustomIcons} from 'components'

@withI18n()
class Sider extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isHover: false,
      collapsedWidth: '30',
    };
  }

  StrictMode = () =>{
    const { theme } = this.props;
    if (ycore.AppSettings.StrictLightMode == false) {
      return "dark"
    }
    return theme
  }

  handleClickMenu = e => {
    e.key === 'SignOut' && ycore.LogoutCall()
    e.key === 'general_settings' && ycore.crouter.native('settings')
    e.key === 'accountpage' && router.push('/account')
    e.key === 'explore' && router.push('main')
    e.key === 'admin_area' && router.push('__m')
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
      theme,
      userData,
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
        defaultCollapsed="true"
        collapsedWidth={this.state.collapsedWidth}
        theme={this.StrictMode()}
        width="180"
        collapsed={collapsed}
        className={classnames(styles.sider, {[styles.darkmd]: this.isDarkMode(), [styles.desktop_mode]: this.props.desktop_mode} )}
        onMouseEnter={() => this.setState({ collapsedWidth: '90' })} 
        onMouseLeave={() => this.setState({ collapsedWidth: '35' })}
      >
        <div className={styles.brand}><img onClick={() => ycore.crouter.native('main')} src={collapsed? config.LogoPath  : config.FullLogoPath } /></div>
        <div className={this.StrictMode()? styles.CollapserWrapperLight : styles.CollapserWrapperDark} ><antd.Button width={'20px'} onClick={() => onCollapseChange(!collapsed)} icon={collapsed? <Icons.RightOutlined/> : <Icons.DoubleLeftOutlined/> } /></div> 
        <div className={styles.menuContainer}>
          <ScrollBar options={{  suppressScrollX: true,  }} >
                <antd.Menu className={collapsed? styles.menuItemsCollapsed : styles.menuItems} mode="vertical" onClick={this.handleClickMenu}>
                     <antd.Menu.Item key="explore">
                          <Icons.CompassOutlined />
                          <Trans><span>Explore</span></Trans> 
                      </antd.Menu.Item> 

                      <antd.Menu.Item key="journal_page">
                        <Icons.ReadOutlined />
                        <Trans><span>Journal</span></Trans>
                      </antd.Menu.Item>
                      
                      <antd.Menu.Item key="marketplace_page">
                        <Icons.ReconciliationOutlined />
                        <Trans><span>Marketplace</span></Trans>
                      </antd.Menu.Item>
                      
                    
                    </antd.Menu>
                   
                    <div className={styles.something_thats_pulling_me_down}>
                    <antd.Menu selectable={false} className={collapsed ?  styles.menuItemsCollapsed : styles.menuItems} mode="vertical" onClick={this.handleClickMenu}>
                       
                      <antd.Menu.Item key="general_settings">
                        <Icons.SettingOutlined/>
                        <Trans><span>Settings</span></Trans>
                      </antd.Menu.Item>
                      {ycore.booleanFix(userData.admin)? 
                        <antd.Menu.Item key="admin_area">
                          <Icons.ThunderboltOutlined />
                          <Trans><span>{userData.username}</span></Trans>
                        </antd.Menu.Item> 
                            : 
                        undefined
                      }
                        <antd.Menu.Item style={{ fontSize: '15px' }} key="LightMode" disabled={false} >
                        {collapsed? <Icons.BulbOutlined /> :
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
                          <Icons.LogoutOutlined style={{ color: 'red' }} />
                         {collapsed ?  null : <Trans>Logout</Trans>}
                        </antd.Menu.Item>
                    </antd.Menu>
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

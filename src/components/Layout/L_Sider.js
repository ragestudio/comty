import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Icon, Switch, Layout, Tag, Divider} from 'antd'
import { withI18n, Trans } from '@lingui/react'
import ScrollBar from '../ScrollBar'
import { config } from 'utils'
import styles from './L_Sider.less'
import { ycore_worker, DevOptions } from 'ycore';
import SiderMenu from './Menu.js'
import { CustomMenu } from './local_components'

@withI18n()
class L_Sider extends PureComponent {

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
      <div className={styles.siderhandler}> 
      <Layout.Sider
        width={215}
        style={{ height: '100%' }}
        theme={this.StrictMode()}
        // style={{ backgroundColor: '#2d2d2d' }}
        breakpoint="lg"
        trigger={null}
        collapsible
        collapsed={collapsed}
        onBreakpoint={isMobile ? null : onCollapseChange}
        className={styles.sider}
      >
        <div className={styles.brand}>
        {collapsed? <div className={styles.logo}><img className={styles.logocollapsed} src={config.logoPath} /></div> : <div className={styles.logo}><img className={styles.logonotcollapsed} src={config.logoPath} /></div> } 
        </div>

        <div className={styles.menuContainer}>
          <ScrollBar
            options={{
              // Disabled horizontal scrolling, https://github.com/utatti/perfect-scrollbar#options
              suppressScrollX: true,
            }}
          >
            <SiderMenu
              menus={menus}
              theme={this.StrictMode()}
              isMobile={isMobile}
              collapsed={collapsed}
              onCollapseChange={onCollapseChange}
            />
            <CustomMenu 
              menus={menus}
              theme={this.StrictMode()}
              isMobile={isMobile}
              collapsed={collapsed}
              onCollapseChange={onCollapseChange}
            />
          </ScrollBar>
        </div>
      </Layout.Sider>
      </div>
    )
  }
}

L_Sider.propTypes = {
  menus: PropTypes.array,
  theme: PropTypes.string,
  isMobile: PropTypes.bool,
  collapsed: PropTypes.bool,
  onThemeChange: PropTypes.func,
  onCollapseChange: PropTypes.func,
}

export default L_Sider

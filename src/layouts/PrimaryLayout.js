/* global window */
/* global document */
import React from 'react'
import PropTypes from 'prop-types'
import {withRouter, connect} from 'umi'
import {
  AppLayout,
} from 'components'
import { enquireScreen, unenquireScreen } from 'enquire-js'
import store from 'store'
import classnames from 'classnames'

import { app_config } from 'config'
import { theme } from 'core/libs/style'
import * as antd from 'antd'

import styles from './PrimaryLayout.less'

const { Content } = antd.Layout
const { Sider, Overlay } = AppLayout
const isActive = (key) => { return key? key.active : false }

@withRouter
@connect(({ app, loading }) => ({ app, loading }))
class PrimaryLayout extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collapsed: app_config.default_collapse_sider ? true : false,
      isMobile: false,
    },
    window.PrimaryComponent = this;
  }

  componentDidMount() {
    this.enquireHandler = enquireScreen(mobile => {
      const { isMobile } = this.state
      if (isMobile !== mobile) {
        this.setState({
          isMobile: mobile,
        })
      }
    })
  }

  componentWillUnmount() {
    unenquireScreen(this.enquireHandler)
  }

  onCollapseChange = () => {
    const fromStore = store.get('collapsed')
    this.setState({ collapsed: !this.state.collapsed })
    store.set('collapsed', !fromStore)
  }

  render() {
    const { location, dispatch, children } = this.props
    const { collapsed, isMobile } = this.state
    const { onCollapseChange } = this
    const currentTheme = theme.get()
    const app_theme = isActive(currentTheme["darkmode"])? "dark" : null

    const breakpoint = {
      xs: '480px',
      sm: '576px',
      md: '768px',
      lg: '992px',
      xl: '1200px',
      xxl: '1600px',
    }

    const SiderProps = {
      breakpoint,
      isMobile,
      collapsed,
      onCollapseChange,
      app_theme
    }

    const OverlayProps = {
      breakpoint,
      isMobile,
      app_theme
    }
   
    window.DarkMode = isActive(currentTheme["darkmode"])? true : false
    return (
      <React.Fragment >
          {isActive(currentTheme['backgroundImage'])
          ?<div style={{ 
                  backgroundImage: `url(${currentTheme.backgroundImage.src})`,
                  transition: "all 150ms linear",
                  position: 'absolute',
                  width: '100vw', 
                  height: '100vh', 
                  backgroundRepeat: "repeat-x",
                  backgroundSize: "cover",
                  backgroundPositionY: "center",
                  overflow: "hidden", 
                  opacity: currentTheme.backgroundImage.opacity
                }} /> : null}
          <antd.Layout id="app" className={classnames(styles.app, { [styles.interfaced]: this.props.app.electron, [styles.dark_mode]: isActive(currentTheme['darkmode'])  } )}>
            <Sider {...SiderProps} />
            <div className={styles.primary_layout_container}>
                <Content
                  id="primaryContent"
                  className={styles.primary_layout_content}
                >
                  {children? children : null}
                </Content>
            </div>
            <Overlay {...OverlayProps} />
          </antd.Layout>
      </React.Fragment>
    )
  }
}

PrimaryLayout.propTypes = {
  children: PropTypes.element.isRequired,
  location: PropTypes.object,
  dispatch: PropTypes.func,
  app: PropTypes.object,
  loading: PropTypes.object,
}

export default PrimaryLayout

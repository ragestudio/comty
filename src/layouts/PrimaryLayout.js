/* global window */
/* global document */
import React from 'react'
import PropTypes from 'prop-types'
import {withRouter, connect} from 'umi'
import {
  AppLayout
} from 'components'
import { enquireScreen, unenquireScreen } from 'enquire-js'
import store from 'store'
import classnames from 'classnames'

import { app_config } from 'config'
import { theme } from 'core/libs/style'
import * as antd from 'antd'
import * as Icons from 'components/Icons'

import styles from './PrimaryLayout.less'

const contextMenuList = [
  {
    key: "inspect_element",
    title: "Inspect",
    icon: <Icons.Command />
  }
]

const { Content } = antd.Layout
const { Sider, Overlay, ContextMenu } = AppLayout
const isActive = (key) => { return key? key.active : false }
const currentTheme = theme.get()

@withRouter
@connect(({ app, loading }) => ({ app, loading }))
class PrimaryLayout extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      collapsed: app_config.default_collapse_sider ? true : false,
      isMobile: false
    },

    this.handleContextMenu = window.addEventListener("contextmenu", (e) => {
      e.preventDefault()
      window.contextMenu.open({ xPos: e.clientX, yPos: e.clientY, fragment: this.generateContextMenu() })
    },false )
    window.DarkMode = isActive(currentTheme["darkmode"])? true : false

    window.contextMenu = this.props.app.contextMenu
    window.contextMenu.toogle = () => {
      this.props.dispatch({
        type: "app/updateState",
        payload: {contextMenu: {...this.props.app.contextMenu, visible: !this.props.app.contextMenu.visible}  }
      })
    }
    window.contextMenu.open = (payload) => {
      if (!payload) return false
      const fragment = payload.fragment || null
      const xPos = payload.xPos || null
      const yPos = payload.yPos || null
      this.props.dispatch({
        type: "app/updateState",
        payload: {contextMenu: {...this.props.app.contextMenu, xPos, yPos, fragment, visible: true}}
      })
    }
  }

  handleContextMenuActions = {
    inspect_element: (e) =>{
      this.props.dispatch({
        type: "app/ipcInvoke",
        payload: {
          key: "inspectElement",
          payload: { x: e.clientX, y: e.clientY }
        }
      })
    }
  }

  generateContextMenu() {
    return contextMenuList.map((e) => {
      return(
        <div onClick={this.handleContextMenuActions[e.key]} key={e.key}>
           {e.icon}{e.title}
        </div>
      )
    })
  }

  componentDidMount() {
    this.handleContextMenu
    
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
    window.removeEventListener("contextmenu", this.handleContextMenu)
    unenquireScreen(this.enquireHandler)
  }

  onCollapseChange = () => {
    const fromStore = store.get('collapsed')
    this.setState({ collapsed: !this.state.collapsed })
    store.set('collapsed', !fromStore)
  }

  render() {
    const { location, dispatch, children, app } = this.props
    const { collapsed, isMobile } = this.state
    const { onCollapseChange } = this
    const { contextMenu } = app
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
   
   
    return (
      <React.Fragment>
          <ContextMenu 
            visible={contextMenu.visible}
            fragment={contextMenu.fragment} 
            xPos={contextMenu.xPos} 
            yPos={contextMenu.yPos}
            onClose={this.handleCloseContextMenu}
          />
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
          <antd.Layout id="app" className={classnames(styles.app, {[styles.interfaced]: this.props.app.electron, [styles.dark_mode]: isActive(currentTheme['darkmode'])  } )}>
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

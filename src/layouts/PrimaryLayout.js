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
import contextMenuList from 'globals/contextMenu'
import styles from './PrimaryLayout.less'

const { Content } = antd.Layout
const { Sider, Overlay, ContextMenu } = AppLayout
const isActive = (key) => { return key? key.active : false }

@withRouter
@connect(({ app, loading }) => ({ app, loading }))
class PrimaryLayout extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      collapsed: app_config.default_collapse_sider ? true : false,
      isMobile: false
    },
    this.handleContextMenu = document.getElementById("root").addEventListener("contextmenu", (e) => {
      e.preventDefault()
      window.contextMenu.open({ xPos: e.clientX, yPos: e.clientY, fragment: window.contextMenu.generate(contextMenuList, e) })
    }, false)

    // include API extensions
    window.requireQuery = (require) =>{
      return new Promise(resolve => {
        this.props.dispatch({
          type: 'app/isUser',
          payload: require,
          callback: (e) => {
            resolve(e)
          }
        })
      })
    }
    window.inspectElement = (e) => this.props.dispatch({
      type: "app/ipcInvoke",
      payload: {
        key: "inspectElement",
         payload: { x: e.clientX, y: e.clientY }
      }
    }) 
    window.toogleSidebarCollapse = () => {
      this.props.dispatch({
        type: "app/handleCollapseSidebar",
        payload: !this.props.app.sidebar_collapsed
      })
    }
    window.contextMenu = this.props.app.contextMenu
    window.contextMenu.open = (payload) => {
      if (!payload) return false
      this.props.dispatch({
        type: "app/updateState",
        payload: {contextMenu: {
          ...this.props.app.contextMenu, 
          xPos: payload.xPos, 
          yPos: payload.yPos, 
          fragment: payload.fragment, 
          visible: true
        }}
      })
    }

    window.contextMenu.handle = (e, ...rest) => {
      if(!e || typeof(e) == 'undefined') {
        return false
      }
    
      typeof(e.onClick) !== 'undefined' && e.onClick ? e.onClick(...rest) : null
      typeof(e.keepOnClick) !== 'undefined' && e.keepOnClick ? null : window.contextMenu.toogle()
    }

    window.contextMenu.generate = (payload, ...rest) => {
      if(!payload) return false
      let tmp = []

      payload.forEach(async(e) => {
        if (typeof(e.params.require) !== 'undefined') {
          if(await window.requireQuery(e.params.require)){
            e.valid = true
            tmp.push(e)
          }else{
            // bruh
          }
        
        }else{
          tmp.push(e)
        }
      })
      return tmp.map((e) => {
        return(
          <div {...e.params.itemProps} onClick={() => window.contextMenu.handle(e.params, ...rest)} key={e.key}>
             {e.icon}{e.title}
          </div>
        )
      })
    }

    window.contextMenu.toogle = () => {
      this.props.dispatch({
        type: "app/updateState",
        payload: {contextMenu: {...this.props.app.contextMenu, visible: !this.props.app.contextMenu.visible}  }
      })
    }
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
    const currentTheme = theme.get()
  
    const SiderProps = { isMobile, collapsed, onCollapseChange }
    const OverlayProps = { isMobile }

    window.darkMode = isActive(currentTheme["darkmode"])? true : false
    document.getElementsByTagName("body")[0].setAttribute("class", window.darkMode? "dark" : "light")

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
          <antd.Layout id="app" className={classnames(styles.app, {
            [styles.interfaced]: this.props.app.electron, 
            [styles.dark_mode]: window.darkMode 
          } )}>
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

/* global window */
/* global document */
import React from 'react'
import PropTypes from 'prop-types'
import { withRouter, connect } from 'umi'
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

import ReduxDebugger from 'debuggers/redux'

const { Content } = antd.Layout
const { Sider, Overlay } = AppLayout
const isActive = (key) => { return key ? key.active : false }

@withRouter
@connect(({ app, contextMenu, loading }) => ({ app, contextMenu, loading }))
class PrimaryLayout extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      collapsed: app_config.default_collapse_sider ? true : false,
      isMobile: false
    }

    // include API extensions
    window.openLink = (e) => {
      if (this.props.app.embedded) {
        this.props.app.electron.shell.openExternal(e)
      } else {
        window.open(e)
      }
    }

    window.requireQuery = (require) => {
      return new Promise(resolve => {
        this.props.dispatch({
          type: 'app/requireQuery',
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
        payload: { x: e.xPos, y: e.yPos }
      }
    })

    window.toogleSidebarCollapse = () => {
      this.props.dispatch({
        type: "app/handleCollapseSidebar",
        payload: !this.props.app.sidebar_collapsed
      })
    }
  }

  componentDidMount() {
    if (this.props.app.embedded) {
      window.contextMenu.addEventListener(
        {
          priority: 1,
          onEventRender: contextMenuList,
          ref: document.getElementById("root")
        }
      )
    }


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
    if (this.props.contextMenu) {
      window.contextMenu.destroy()
    }
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
    const currentTheme = theme.get()

    const SiderProps = { isMobile, collapsed, onCollapseChange }
    const OverlayProps = { isMobile }

    window.darkMode = isActive(currentTheme["darkmode"]) ? true : false
    document.getElementsByTagName("body")[0].setAttribute("class", window.darkMode ? "dark" : "light")

    return (
      <React.Fragment>
        {isActive(currentTheme['backgroundImage'])
          ? <div style={{
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
        })}>
          <Sider {...SiderProps} />
          <div className={styles.primary_layout_container}>
            <Content
              id="primaryContent"
              className={styles.primary_layout_content}
            >
              {children ? children : null}
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

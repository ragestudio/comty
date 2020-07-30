/* global window */
/* global document */
import React from 'react'
import PropTypes from 'prop-types'
import {withRouter, connect} from 'umi'
import {
  MyLayout,
  PageTransition,
} from 'components'
import { enquireScreen, unenquireScreen } from 'enquire-js'
import store from 'store'
import classnames from 'classnames'

import { app_config } from 'config'
import { theme } from 'core/libs/style'
import * as antd from 'antd'

import styles from './PrimaryLayout.less'

const { Content } = antd.Layout
const { Sider, Control, Overlay } = MyLayout

@withRouter
@connect(({ app, loading }) => ({ app, loading }))
class PrimaryLayout extends React.PureComponent {
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

  renderThemeComponents() {
    const currentTheme = theme.get()
    if (!currentTheme) return false
    if (currentTheme.backgroundImage) {
      return currentTheme.backgroundImage.active? <div style={{ 
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
      }} /> : null
    }

  }
  render() {
    const { location, dispatch, children } = this.props
    const { collapsed, isMobile } = this.state
    const { onCollapseChange } = this

    const SiderProps = {
      breakpoint:{
        xs: '480px',
        sm: '576px',
        md: '768px',
        lg: '992px',
        xl: '1200px',
        xxl: '1600px',
      },
      isMobile,
      collapsed,
      onCollapseChange
    }

    return (
      <React.Fragment>
        <Control />
          {this.renderThemeComponents()}
          <antd.Layout id="primaryLayout" className={classnames(styles.primary_layout, {[styles.mobile]: isMobile})}>
            <Sider {...SiderProps} />
            <div className={styles.primary_layout_container}>
              <PageTransition
                preset="moveToRightScaleUp"
                transitionKey={location.pathname}
              >
                <Content
                  id="primaryContent"
                  className={styles.primary_layout_content}
                >
                  {children? children : null}
                </Content>
              </PageTransition>
            </div>
            <Overlay />
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

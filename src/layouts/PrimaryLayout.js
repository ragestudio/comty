/* global window */
/* global document */
import React from 'react'
import PropTypes from 'prop-types'
import withRouter from 'umi/withRouter'
import { connect } from 'dva'
import {
  MyLayout,
  PageTransition,
  HeaderSearch,
} from 'components'
import { enquireScreen, unenquireScreen } from 'enquire-js'
import store from 'store'
import classnames from 'classnames'

import * as app from 'app'
import * as antd from 'antd'

import styles from './PrimaryLayout.less'

const { Content } = antd.Layout
const { Sider, Control, Overlay, WindowAppBar } = MyLayout

export function updateTheme(data){
  if (!data) return false
  console.log(data)
  return PrimaryComponent.setState({theme: data})
}


@withRouter
@connect(({ app, loading }) => ({ app, loading }))
class PrimaryLayout extends React.PureComponent {
  constructor(props) {
    super(props)
    window.PrimaryComponent = this
    this.state = {
      theme: app.app_theme.getStyle(),
      collapsed: app.AppSettings.default_collapse_sider ? true : false,
      isMobile: false,
      desktop_mode: false,
      userData: '',
    }
  }

  componentDidMount() {
   
    this.setState({
      userData: app.userData(),
    })

    this.enquireHandler = enquireScreen(mobile => {
      const { isMobile } = this.state
      if (isMobile !== mobile) {
        this.setState({
          isMobile: mobile,
        })
        store.set('mobile_src', mobile)
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
    const { userData, collapsed, isMobile, theme, predominantColor } = this.state
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
      predominantColor,
      theme,
      userData,
      isMobile,
      collapsed,
      onCollapseChange,
      onThemeChange(theme) {
        dispatch({
          type: 'app/handleThemeChange',
          payload: theme,
        })
      },
    }

    const OverlayProps = {
      userData,
      isMobile,
    }
    console.log(theme)
    return (
      <React.Fragment>
          <div className={classnames(styles.__ControlBar, {[styles.mobile]: isMobile})}>
            <Control mobile={isMobile} />
          </div>
          <antd.Layout style={theme} id="primaryLayout" className={classnames(styles.primary_layout, {[styles.mobile]: isMobile})}>
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

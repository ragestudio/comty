/* global window */
/* global document */
import React from 'react'
import PropTypes from 'prop-types'
import withRouter from 'umi/withRouter'
import { connect } from 'dva'
import { MyLayout, PageTransition, HeaderSearch, MobileWarning } from 'components'
import { enquireScreen, unenquireScreen } from 'enquire-js'
import store from 'store';
import classnames from 'classnames'

import * as ycore from 'ycore'
import * as antd from 'antd'
import * as Icons from '@ant-design/icons'

import styles from './PrimaryLayout.less'

const { Content } = antd.Layout
const { Sider, Control, Secondary, WindowAppBar } = MyLayout

@withRouter
@connect(({ app, loading }) => ({ app, loading }))
class PrimaryLayout extends React.Component {
  constructor(props){
    super(props)
    window.PrimaryComponent = this;
    this.state = {
      collapsed: (ycore.AppSettings.default_collapse_sider? true : false),
      isMobile: false,
      desktop_mode: false,
      userData: ''
    }
  }

  componentDidMount() {
    this.setState({ 
      userData: ycore.userData(),
      desktop_mode: ycore.CheckThisApp.desktop_mode()
    })
   
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
    store.set('collapsed',  !fromStore) 
  }

  isDarkMode = () => {
    const {app} = this.props
    const { theme } = app
    if (theme == "light") {
      return false;
    }
    return true;
  }
    
  render() {
    const { app, location, dispatch, children } = this.props
    const { userData, collapsed, isMobile, desktop_mode } = this.state
    const { onCollapseChange } = this
    const { theme } = app
  
    const SiderProps = {
      desktop_mode: desktop_mode,
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

    const SecondaryProps = {
      desktop_mode: desktop_mode,
      userData,
      isMobile,
      theme,
    }

      return (
        <React.Fragment >
          <div className={classnames(styles.AppWrapper, {[styles.desktop_mode]: desktop_mode})}>
            {isMobile?  <MobileWarning /> : null}
            <div className={styles.BarControlWrapper}><Control /></div>
            <antd.Layout className={classnames( styles.layout, {[styles.md_dark]: this.isDarkMode(), [styles.desktop_mode]: desktop_mode })}>
             <Sider {...SiderProps}/>

              <div id="primaryLayout" className={styles.leftContainer}>
                  <PageTransition preset="moveToRightScaleUp" id="scroller" transitionKey={location.pathname}>
                      <Content className={classnames(styles.content, {[styles.collapsed]: !collapsed} )}>
                          <HeaderSearch />
                          {children}
                      </Content>
                  </PageTransition>
              </div>  

              <Secondary {...SecondaryProps} />

            </antd.Layout>
          </div>
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

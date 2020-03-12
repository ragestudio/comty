/* global window */
/* global document */
import React, { PureComponent, Fragment } from 'react'
import PropTypes from 'prop-types'
import withRouter from 'umi/withRouter'
import { connect } from 'dva'
import { MyLayout, PageTransition, HeaderSearch } from 'components'
import { Layout, Result, Button } from 'antd'
import { enquireScreen, unenquireScreen } from 'enquire-js'
import { langFromPath } from 'utils'
import store from 'store';
import classnames from 'classnames'

import * as ycore from 'ycore'
import * as antd from 'antd'
import * as Icons from '@ant-design/icons'

import styles from './PrimaryLayout.less'

const { Content } = Layout
const { Sider, Control } = MyLayout

const userData = ycore.SDCP()

@withRouter
@connect(({ app, loading }) => ({ app, loading }))
class PrimaryLayout extends PureComponent {
  constructor(props){
    super(props)
    window.PrimaryComponent = this;
    this.state = {
      collapsed: ycore.DevOptions.default_collapse_sider,
      isMobile: false,
      resbypass:  store.get('resbypass') || false,
      RemByPass: false,
      BarControls: [],
      ContentSecondLayer: null,
    }
    this.ResByPassHandler = this.ResByPassHandler.bind(this);
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

  setControls(e){
    this.setState({BarControls: e})
  }

  onCollapseChange = () => {
    const fromStore = store.get('collapsed')
    this.setState({ collapsed: !this.state.collapsed })
    store.set('collapsed',  !fromStore) 
  }

  ResByPassHandler() {
    const {RemByPass} = this.state;
    if (RemByPass == true){
      this.setState({resbypass: true})
      store.set('resbypass', true)
      return
    }
    this.setState({resbypass: true})
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
    const { theme, routeList, notifications } = app
    const { isMobile, resbypass } = this.state
    const collapsed = (this.state.collapsed? true : false)

    const { onCollapseChange } = this
    // Localized route name.
    const lang = langFromPath(location.pathname)
    const newRouteList =
      lang !== 'en'
        ? routeList.map(item => {
            const { name, ...other } = item
            return {
              ...other,
              name: (item[lang] || {}).name || name,
            }
          })
        : routeList


    
    const SiderProps = {
      theme,
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
  
    const ContainerProps = {
      theme,
      collapsed,
    }
    const MobileWarning = () =>{
      if (resbypass == false) {
         if (isMobile == true) {
            return(
              <div className={styles.mobilewarning}>
                 <Result status="warning" title="Low resolution warning" 
                  extra={ <div style={{ color: "white" }}><h3 style={{ color: "white" }}>This version of the application is not fully compatible with the resolution of this screen, a higher resolution is recommended for an optimal experience</h3><span>Please choose an option to continue</span><br /><br /><Button type="dashed" onClick={this.ResByPassHandler}>Continue</Button></div> }/>
              </div>
            )
         }
      }
      return null
    }

  
    return (
        <Fragment>
          <MobileWarning />
          <div className={styles.BarControlWrapper}><Control /></div>
          <Layout className={classnames( styles.layout, {[styles.md_dark]: this.isDarkMode() })}>
           <Sider {...SiderProps}/>

            <div id="primaryLayout" className={styles.leftContainer}>
                <PageTransition preset="moveToRightScaleUp" id="scroller" transitionKey={location.pathname}>
                   
                    <Content {...ContainerProps} className={classnames(styles.content, {[styles.collapsed]: !collapsed} )}>
                        <HeaderSearch />
                        {children}
                    </Content>
                </PageTransition>
            </div>  

            <div id="secondaryLayout" className={styles.rightContainer}>
                
                  <div className={styles.SecondHeader}>
                    <div className={styles.notif_box}></div>
                    <img onClick={() => ycore.crouter.native(`@${userData.username}`)} src={userData.avatar} />
                  </div>
                  <Fragment>
                     {this.state.ContentSecondLayer}
                  </Fragment>
 
            </div>

          </Layout>
        </Fragment>
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

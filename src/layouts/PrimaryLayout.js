/* global window */
/* global document */
import React, { PureComponent, Fragment } from 'react'
import PropTypes from 'prop-types'
import withRouter from 'umi/withRouter'
import { connect } from 'dva'
import { MyLayout } from 'components'
import { Layout, Drawer, Result, Button, Checkbox } from 'antd'
import { enquireScreen, unenquireScreen } from 'enquire-js'
import { config, pathMatchRegexp, langFromPath } from 'utils'
import store from 'store';
import classNames from 'classnames'
import Error from '../pages/404'
import styles from './PrimaryLayout.less'

const { Content } = Layout
const { Header, L_Sider, R_Sider, Control } = MyLayout

@withRouter
@connect(({ app, loading }) => ({ app, loading }))
class PrimaryLayout extends PureComponent {
  constructor(props){
    super(props)
    this.state = {
      isMobile: false,
      resbypass:  store.get('resbypass') || false,
      RemByPass: false,
      BarControls: [],
    }
    this.ResByPassHandler = this.ResByPassHandler.bind(this);
  }
  setControls(e){
    this.setState({BarControls: e})
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

  onCollapseChange = collapsed => {
    this.props.dispatch({
      type: 'app/handleCollapseChange',
      payload: collapsed,
    })
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
    const { theme, routeList, collapsed, notifications } = app
    const { isMobile, resbypass, rememberbypass } = this.state
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

    // Find a route that matches the pathname.
    const currentRoute = newRouteList.find(
      _ => _.route && pathMatchRegexp(_.route, location.pathname)
    )

    // MenuParentId is equal to -1 is not a available menu.
    const menus = newRouteList.filter(_ => _.menuParentId !== '-1')
    const headerProps = {
      menus,
      theme,
      collapsed,
      newRouteList,
      notifications,
      onCollapseChange,      
      onThemeChange(theme) {
        dispatch({
          type: 'app/handleThemeChange',
          payload: theme,
        })
      },
      fixed: config.fixedHeader,
      onAllNotificationsRead() {
        dispatch({ type: 'app/allNotificationsRead' })
      },
      
    }
    const RightSiderProps = {
      theme,
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
    }
    const MobileWarning = () =>{
      if (resbypass == false) {
         if (isMobile == true) {
            return(
              <div className={styles.mobilewarning}>
                 <Result status="warning" title="Low resolution warning" 
                  extra={ <div style={{ color: "white" }}><h3 style={{ color: "white" }}>This version of the application is not fully compatible with the resolution of this screen, a higher resolution is recommended for an optimal experience</h3><span>Please choose an option to continue</span><br /><br /><br /><Checkbox onChange={this.setState({ RemByPass: true })}>Don't Show this again</Checkbox><br /><br /><br /><Button type="dashed" onClick={this.ResByPassHandler}>Continue</Button></div> }/>
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
          <Layout className={this.isDarkMode()? styles.container_dark : styles.container_light}>
            <div className={styles.container}>
              <div style={{ paddingTop: config.fixedHeader ? 72 : 0 }} id="primaryLayout" >
                <Header {...headerProps} />
                <Content {...ContainerProps} className={styles.content}>
                    {children}
                </Content>
              </div>
            </div>  
            <R_Sider {...RightSiderProps}/>
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

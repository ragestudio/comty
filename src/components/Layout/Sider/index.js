import React from 'react'
import { app_config } from 'config'
import { router } from 'core/libs'

import Sider_Mobile from './mobile'
import Sider_Default from './default'
import { connect } from 'umi'
import MenuList from 'globals/sidebar_menu.js'

@connect(({ app, extended }) => ({ app, extended }))
class Sider extends React.PureComponent {
  state = {
    loading: true,
    menus: []
  }

  handleClickMenu = e => {
    router.go(`/${e.key}`)
  }

  requireQuery(require){
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

  async menuQuery(data){
    if (!data) return false
    this.setState({ loading: true })

    const filterArray = (data) =>{
      return new Promise(resolve => {
        let menuMap = {
          desktop: [],
          mobile: []
        }
        data.forEach(async (element) => {
          if(!element.attributes){
            element.attributes = {}
          }
          let validRequire = typeof(element.attributes.require) !== 'undefined'? await this.requireQuery(element.attributes.require) : true
          let onDekstopMode = typeof(element.attributes.desktop) !== 'undefined'? element.attributes.desktop : true
          let onMobileMode = typeof(element.attributes.mobile) !== 'undefined'? element.attributes.mobile : true
    
          if (validRequire) {
            onDekstopMode? menuMap.desktop.push(element) : null
            onMobileMode? menuMap.mobile.push(element) : null
          }
        })
        resolve(menuMap)
      })
    }

    this.setState({ menus: await filterArray(data), loading: false })
  }

  componentDidMount(){
    const extended = this.props.extended.sidebar
    if(extended){
      console.log("Extending state with => ", extended)
      this.setState({ ...this.state, extended })
    }
    this.menuQuery(MenuList)
  }


  render() {
    const { isMobile } = this.props
    const sider_props = { handleClickMenu: this.handleClickMenu, logo: app_config.LogoPath }
  
    if(this.state.loading) return null
    return isMobile? <Sider_Mobile menus={this.state.menus.mobile} {...sider_props} /> : <Sider_Default menus={this.state.menus.desktop} {...sider_props} />
  }
}

export default Sider

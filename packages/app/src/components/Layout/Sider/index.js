import React from 'react'
import config from 'config'
import { router } from 'core/libs'
import { connect } from 'umi'
import MenuList from 'schemas/sidebar_menu.json'

import Sider_Mobile from './mobile'
import Sider_Default from './default'

@connect(({ app, extended }) => ({ app, extended }))
class Sider extends React.Component {
  state = {
    loading: true,
    menuAtrributes: [],
    menus: []
  }

  handleClickMenu = e => {
    const elementAtrributes = this.state.menuAtrributes[e.key]

    if (typeof (this.state.menuAtrributes[e.key]) !== "undefined") {
      if (typeof (elementAtrributes.onClick) == "function") {
        elementAtrributes.onClick()
      }
    }

    router.go(`/${e.key}`) // by default push to router
  }

  async menuQuery(data) {
    if (!data) return false
    this.setState({ loading: true })

    const filterArray = (data) => {
      return new Promise(resolve => {
        let menuMap = []
        let menuAtrributes = []
        data.forEach(async (element) => {
          if (!element.attributes) {
            element.attributes = {}
          }
          let validRequire = typeof (element.attributes.require) !== 'undefined' ? await window.requireQuery(element.attributes.require) : true

          if (validRequire) {
            menuAtrributes[element.id] = element.attributes
            menuMap.push(element)
          }
        })
        this.setState({ menuAtrributes })
        resolve(menuMap)
      })
    }

    this.setState({ menus: await filterArray(data), loading: false })
  }

  componentDidMount() {
    this.menuQuery(MenuList)
  }

  filterMenusByType(type) {
    let arrayResults = []
    this.state.menus.forEach((e) => {
      if (typeof (e.attributes) !== "undefined") {
        const isType = typeof (e.attributes[type]) !== "undefined" ? e.attributes[type] : true // Returns as valid by default if is not set
        if (isType) {
          arrayResults.push(e)
        }
      }
    })
    return arrayResults
  }

  renderByType(type) {
    const sider_props = { handleClickMenu: this.handleClickMenu, logo: config.app.LogoPath }
    const filteredMenus = this.filterMenusByType(type)
    switch (type) {
      case "desktop": {
        return <Sider_Default menus={filteredMenus} {...sider_props} />
      }
      case "mobile": {
        return <Sider_Mobile menus={filteredMenus} {...sider_props} />
      }
      default: {
        return null // include invalid default
      }
    }
  }


  render() {
    const { isMobile } = this.props
    if (this.state.loading) return null
    return this.renderByType(isMobile ? "mobile" : "desktop")
  }
}

export default Sider

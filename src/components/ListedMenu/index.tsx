import React from 'react'
import { Menu, Result } from 'antd'
import classnames from 'classnames'

import styles from './index.less'
import { __proto__filterSchematizedArray } from 'core'

export default class ListedMenu extends React.Component{
    state = {
        renderOptionTitle: true,
        loading: true,
        selectKey: '',
        menus: [],
        mode: this.props.mode ?? "inline"
    }
    

    async queryMenu() {
      this.setState({ loading: true })
      this.setState({ menus: await __proto__filterSchematizedArray(this.props.menuArray), loading: false })
    }

    getMenu() {
      return this.state.menus.map(item => (
        <Menu.Item key={item.key}>
          <span>{item.icon} {item.title}</span>
        </Menu.Item>
      ))
    }
    
    selectKey = (key: any) => {
      this.setState({
        selectKey: key,
      })
    }

    renderChildren = () => {
        let titlesArray: never[] = []
        this.state.menus.forEach(e => { titlesArray[e.key] = e })

        const OptionTitle = () => {
            if (this.state.renderOptionTitle) {
                return <div>
                    <h3>{titlesArray[this.state.selectKey].icon || null}{titlesArray[this.state.selectKey].title || null}</h3>
                </div>
            }
            return null
        }

        if(this.state.selectKey && titlesArray[this.state.selectKey]){
          return <>
            <OptionTitle />
            {this.props.childrens[this.state.selectKey]}
          </>
        }else {
          return(
            <Result title="Select an Option" state="info" />
          )
        }
    }

    componentDidMount(){
        const { childrens, menuArray, defaultKey } = this.props
        const keyIndex = new URLSearchParams(location.search).get('key')
        
        if(keyIndex && typeof(this.props.childrens[keyIndex]) !== "undefined"){
            this.selectKey(keyIndex)
        }else if (defaultKey != null) {
            this.selectKey(defaultKey)
        }

        if (this.props.renderOptionTitle != null) {
            this.setState({ renderOptionTitle: this.props.renderOptionTitle })
        }

        if (childrens != null && menuArray != null) {
            this.queryMenu()
        }
    }

    render() {
        const { selectKey, loading } = this.state
        const isMode = (e: string) => {
            return this.state.mode === `${e}`
        }

        if(loading){
          return <></>
        }
        return (
          <div style={this.props.wrapperStyle ?? null} className={classnames(styles.main, {[styles.horizontal]: isMode("horizontal") })}>
            <div className={styles.menuList}>
              <h3>
                {this.props.icon ?? null} {this.props.title ?? "Menu"}
              </h3>
              <Menu
                mode={this.state.mode}
                selectedKeys={[selectKey]}
                onClick={({key}) => this.selectKey(key)}
              >
                {this.getMenu()}
              </Menu>
            </div>
            <div className={styles.menuContainer}>{this.renderChildren()}</div>
          </div>
        )
    }
}
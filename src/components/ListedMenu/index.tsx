import React from 'react'
import { Menu, Result } from 'antd'
import classnames from 'classnames'

import styles from './index.less'
import { connect } from 'umi';

@connect(({ app }) => ({ app }))
export default class ListedMenu extends React.Component{
    state = {
        renderOptionTitle: true,
        loading: true,
        selectKey: '',
        menus: [],
        mode: this.props.mode ?? "inline"
    }

    filterArray(data: any[]) {
        let tmp: any = []
        return new Promise(resolve => {
          data.forEach(async (element: { require: string; }) => {
            if (typeof(element.require) !== 'undefined') {
              const validRequire = await window.requireQuery(element.require)
              validRequire? tmp.push(element) : null
            }else{
              tmp.push(element)
            }
          })
          resolve(tmp)
        })
    }

    async queryMenu() {
      this.setState({ loading: true })
      this.setState({ menus: await this.filterArray(this.props.menuArray), loading: false })
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
                    <h2>{titlesArray[this.state.selectKey].icon || null}{titlesArray[this.state.selectKey].title || null}</h2>
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
              <h2>
                {this.props.icon ?? null} {this.props.title ?? "Menu"}
              </h2>
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
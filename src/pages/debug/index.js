import React from 'react'
import { Menu } from 'antd'
import * as Icons from 'components/Icons'

import styles from './index.less'

import ApiDebug from './api.js'
import AntdDebug from './antd.js'
import CoreDebug from './core.js'
import ThemeDebug from './theme.js'

const debbugers = {
  apiDebug: <ApiDebug />,
  antdDebug: <AntdDebug />,
  coreDebug: <CoreDebug />,
  themeDebug: <ThemeDebug />
}

const { Item } = Menu
const menuMap = {
  apiDebug: (
    <span>
      <Icons.Globe /> V3 Api
    </span>
  ),
  antdDebug: (
    <span>
      <Icons.AntDesignOutlined /> Antd
    </span>
  ),
  coreDebug: (
    <span>
      <Icons.Box /> Core
    </span>
  ),
  themeDebug: (
    <span>
      <Icons.Image /> Theme
    </span>
  )
}

export default class Debug extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      selectKey: '',
    }
  }

  getMenu = () => {
    return Object.keys(menuMap).map(item => (
      <Item key={item}>{menuMap[item]}</Item>
    ))
  }

  selectKey = key => {
    this.setState({
      selectKey: key,
    })
  }

  renderChildren = () => {
    try {
      if (!this.state.selectKey) {
        return <div>Select an debugger</div>
      }
      return debbugers[this.state.selectKey]
    } catch (error) {
      return <div>Select an debugger</div>
    }
  }

  render() {
    const { selectKey } = this.state
    return (
      <div className={styles.main}>
          <h2>
            <Icons.SettingOutlined /> Debuggers
          </h2>
          <Menu
            mode="horizontal"
            selectedKeys={[selectKey]}
            onClick={({ key }) => this.selectKey(key)}
          >
            {this.getMenu()}
          </Menu>
     
        <div className={styles.debuggerComponent}>{this.renderChildren()}</div>
      </div>
    )
  }
}
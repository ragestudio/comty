import React from 'react'
import { Menu } from 'antd'
import * as Icons from 'components/Icons'

import styles from './index.less'
import ApiDebug from './debuggers/api'
import AntdDebug from './debuggers/antd'
import CoreDebug from './debuggers/core'
import ThemeDebug from './debuggers/theme'
import SocketDebug from './debuggers/socket'
import VerbosityDebug from './debuggers/verbosity'

const Debuggers = {
  api: <ApiDebug />,
  antd: <AntdDebug />,
  core: <CoreDebug />,
  theme: <ThemeDebug />,
  socket: <SocketDebug />,
  verbosity: <VerbosityDebug />
}

const menuList = [
  {
    key: "api",
    title: "API V3 Requester",
    icon: <Icons.Globe />,
  },
  {
    key: "antd",
    title: "Antd",
    icon: <Icons.AntDesignOutlined />,
    require: "embedded"
  },
  {
    key: "core",
    title: "Core",
    icon: <Icons.Box />
  },
  {
    key: "theme",
    title: "Theme",
    icon: <Icons.Image />
  },
  {
    key: "socket",
    title: "Socket",
    icon: <Icons.Box />
  },
  {
    key: "verbosity",
    title: "Verbosity",
    icon: <Icons.Edit3 />
  }
]

export default class Debug extends React.Component {
  state = {
    loading: true,
    selectKey: '',
    menus: []
  }

  getMenu() {
    return this.state.menus.map(item => (
      <Menu.Item key={item.key}>
        <span>{item.icon} {item.title}</span>
      </Menu.Item>
    ))
  }
  
  selectKey = key => {
    this.setState({
      selectKey: key,
    })
  }

  renderChildren = () => {
    let titlesArray = []
    this.state.menus.forEach(e => {
      titlesArray[e.key] = e
    })
    if(this.state.selectKey){
      return Debuggers[this.state.selectKey]
    }else{
      <div> Select an Option </div>
    }
  }

  componentDidMount(){
    this.setState({ menus: menuList, loading: false })
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
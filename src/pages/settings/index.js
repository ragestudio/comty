import React from 'react'
import { Menu } from 'antd'
import * as Icons from 'components/Icons'

import styles from './style.less'

import NotificationView from './components/notification/index.js'
import SecurityView from './components/security/index.js'
import Earnings from './components/earnings/index.js'

import Base from './components/base.js'
import AppAbout from './components/about.js'
import Theme from './components/theme'

const Settings = {
  base: <Base />,
  about: <AppAbout />,
  theme: <Theme />,
  earnings: <Earnings />,
  security: <SecurityView />,
  notification: <NotificationView />
}


const { Item } = Menu

const menuList = [
  {
    key: "base",
    title: "General",
    icons: <Icons.ControlOutlined />,
  },
  {
    key: "app",
    title: "Application",
    icons: <Icons.Command />,
    require: "embedded"
  },
  {
    key: "theme",
    title: "Customization",
    icons: <Icons.Layers />,
  },
  {
    key: "security",
    title: "Security & Privacity",
    icons: <Icons.ControlOutlined />,
  },
  {
    key: "notification",
    title: "Notification",
    icons: <Icons.Bell />,
  },
  {
    key: "help",
    title: "Help",
    icons: <Icons.LifeBuoy />,
  },
  {
    key: "about",
    title: "About",
    icons: <Icons.Info />,
  },
]

class GeneralSettings extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      selectKey: 'base',
    }
  }

  getMenu = () => {
    return menuList.map(item => (
      <Item key={item.key}>
        <span>{item.icons} {item.title}</span>
      </Item>
    ))
  }

  selectKey = key => {
    this.setState({
      selectKey: key,
    })
  }

  renderChildren = () => {
    if(this.state.selectKey){
      return Settings[this.state.selectKey]
    }else{
      <div> Select an setting </div>
    }
  }

  render() {
    const { selectKey } = this.state
    return (
      <div className={styles.main}>
        <div className={styles.leftMenu}>
          <h2>
            <Icons.SettingOutlined /> Settings
          </h2>
          <Menu
            mode="inline"
            selectedKeys={[selectKey]}
            onClick={({ key }) => this.selectKey(key)}
          >
            {this.getMenu()}
          </Menu>
        </div>
        <div className={styles.right}>{this.renderChildren()}</div>
      </div>
    )
  }
}

export default GeneralSettings

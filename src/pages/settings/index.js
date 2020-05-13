import React from 'react'
import { Menu } from 'antd'
import * as Icons from 'components/Icons'
import * as Feather from 'feather-reactjs'

import styles from './style.less'

import NotificationView from './components/notification/index.js'
import SecurityView from './components/security/index.js'
import Earnings from './components/earnings/index.js'

import Base from './components/base.js'
import AppAbout from './components/about.js'
import Theme from './components/theme'

const { Item } = Menu
const menuMap = {
  base: (
    <span>
      <Icons.ControlOutlined /> General
    </span>
  ),
  theme: (
    <span>
      <Feather.Layers /> Theme
    </span>
  ),
  sync: (
    <span>
      <Icons.SyncOutlined /> Sync™
    </span>
  ),
  security: (
    <span>
      <Feather.Lock /> Security & Privacity
    </span>
  ),
  notification: (
    <span>
      <Feather.Bell /> Notification
    </span>
  ),
  earnings: (
    <span>
      <Icons.DollarCircleOutlined /> Earnings
    </span>
  ),
  help: (
    <span>
      <Icons.LifeBuoy /> Help
    </span>
  ),
  about: (
    <span>
      <Feather.Info /> About
    </span>
  ),
}

class GeneralSettings extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      selectKey: 'base',
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
    const { selectKey } = this.state
    switch (selectKey) {
      case 'base':
        return <Base />
      case 'security':
        return <SecurityView />
      case 'theme':
        return <Theme />
      case 'notification':
        return <NotificationView />
      case 'about':
        return <AppAbout />
      case 'earnings':
        return <Earnings />
      default:
        break
    }
    return null
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

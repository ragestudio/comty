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
import ElectronApp from './components/electron'

const Settings = {
  base: <Base />,
  about: <AppAbout />,
  theme: <Theme />,
  earnings: <Earnings />,
  security: <SecurityView />,
  notification: <NotificationView />,
  app: <ElectronApp />
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

import { connect } from 'umi';

@connect(({ app }) => ({ app }))
class GeneralSettings extends React.PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      loading: true,
      selectKey: 'base',
      menus: []
    }
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

  async queryMenu() {
    this.setState({ loading: true })

    const filterArray = (data) =>{
      let tmp = []
      return new Promise(resolve => {
        data.forEach(async (element) => {
          if (typeof(element.require) !== 'undefined') {
            const validRequire = await this.requireQuery(element.require)
            validRequire? tmp.push(element) : null
          }else{
            tmp.push(element)
          }
        })
        resolve(tmp)
      })
    }

    this.setState({ menus: await filterArray(menuList), loading: false })
  }

  getMenu() {
    return this.state.menus.map(item => (
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

  componentDidMount(){
    this.queryMenu()
  }

  render() {
    const { selectKey, loading } = this.state
    if(loading){
      return <></>
    }
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

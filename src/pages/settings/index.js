import React from 'react'
import { Menu, Result } from 'antd'
import * as Icons from 'components/Icons'

import styles from './style.less'
import { connect } from 'umi';

import NotificationView from './components/notification/index.js'
import SecurityView from './components/security/index.js'

import Base from './components/base.js'
import AppAbout from './components/about.js'
import Theme from './components/theme'
import ElectronApp from './components/electron'
import Keybinds from './components/keybinds'
import Plugins from './components/plugins'

const Settings = {
  base: <Base />,
  about: <AppAbout />,
  keybinds: <Keybinds />,
  theme: <Theme />,
  plugins: <Plugins />,
  security: <SecurityView />,
  notification: <NotificationView />,
  app: <ElectronApp />
}

const menuList = [
  {
    key: "base",
    title: "General",
    icon: <Icons.template />,
  },
  {
    key: "app",
    title: "Application",
    icon: <Icons.Command />,
    require: "embedded"
  },
  {
    key: "keybinds",
    title: "Keybinds",
    icon: <Icons.lightningBolt />
  },
  {
    key: "theme",
    title: "Customization",
    icon: <Icons.sparkles />,
  },
  {
    key: "plugins",
    title: "Plugins",
    icon: <Icons.cubeTransparent />,
  },
  {
    key: "security",
    title: "Security & Privacity",
    icon: <Icons.keyRound />,
  },
  {
    key: "notification",
    title: "Notification",
    icon: <Icons.Bell />,
  },
  {
    key: "help",
    title: "Help",
    icon: <Icons.LifeBuoy />,
  },
  {
    key: "about",
    title: "About",
    icon: <Icons.Info />,
  }
]

@connect(({ app }) => ({ app }))
class GeneralSettings extends React.Component {
  state = {
    loading: true,
    selectKey: 'base',
    menus: []
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
            const validRequire = await window.requireQuery(element.require)
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
    this.state.menus.forEach(e => { titlesArray[e.key] = e })

    if(this.state.selectKey && titlesArray[this.state.selectKey]){
      return <>
        <div>
          <h2>{titlesArray[this.state.selectKey].icon || null}{titlesArray[this.state.selectKey].title || null}</h2>
        </div>
        {Settings[this.state.selectKey]}
      </>
    }else {
      return(
        <Result title="Select an Option" state="info" />
      )
    }
  }

  componentDidMount(){
    const keyIndex = new URLSearchParams(location.search).get('key')
    if(keyIndex && typeof(Settings[keyIndex]) !== "undefined"){
      this.setState({selectKey: keyIndex})
    }
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
            onClick={({key}) => this.selectKey(key)}
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

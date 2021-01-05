import React from 'react'
import * as Icons from 'components/Icons'

import { ListedMenu } from 'components'

import NotificationView from './components/notification'
import SecurityView from './components/security'
import Base from './components/general'
import AppAbout from './components/about'
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

class GeneralSettings extends React.Component {
  render() {
    return <ListedMenu defaultKey="base" icon={<Icons.SettingOutlined />} title="Settings" childrens={Settings} menuArray={menuList} />
  }
}

export default GeneralSettings

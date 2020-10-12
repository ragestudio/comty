import React from 'react'
import * as Icons from 'components/Icons'
import { ListedMenu } from 'components'

import ApiDebug from './debuggers/api'
import CoreDebug from './debuggers/core'
import ThemeDebug from './debuggers/theme'
import SocketDebug from './debuggers/socket'
import VerbosityDebug from './debuggers/verbosity'
import InternalDebug from './debuggers/internals'


const Debuggers = {
  api: <ApiDebug />,
  core: <CoreDebug />,
  theme: <ThemeDebug />,
  socket: <SocketDebug />,
  verbosity: <VerbosityDebug />,
  internals: <InternalDebug />
}

const menuList = [
  {
    key: "api",
    title: "API V3 Requester",
    icon: <Icons.Globe />,
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
  },
  {
    key: "internals",
    title: "Internals",
    icon: <Icons.Box />
  }
]

export default class Debug extends React.Component {
  render() {
    return <ListedMenu wrapperStyle={{ padding: "4px" }} mode="horizontal" renderOptionTitle={false} icon={<Icons.Activity />} title="Debug" childrens={Debuggers} menuArray={menuList} />
  }
}
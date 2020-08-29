import React from 'react'
import * as Icons from 'components/Icons'
import * as antd from 'antd'
import styles from './index.less'

import Sessions_Manager from './sessions.js'

const { Menu } = antd
export default class SecurityView extends React.Component {
  state = {
    current: 'privacy',
  }

  handleClick = e => {
    this.setState({
      current: e.key,
    })
  }

  renderChildren = () => {
    const { current } = this.state
    switch (current) {
      case 'privacy':
        return null
      case 'credentials':
        return null
      case 'sessions':
        return <Sessions_Manager />
      default:
        break
    }
    return null
  }

  render() {
    return (
      <div className={styles.main}>
        <h2>
          <Icons.LockOutlined /> Your Security & Privacy
          <Menu
            onClick={this.handleClick}
            selectedKeys={[this.state.current]}
            mode="horizontal"
          >
            <Menu.Item key="privacy">
              <Icons.AimOutlined />
              Privacy
            </Menu.Item>
            <Menu.Item key="credentials">
              <Icons.KeyOutlined />
              Credentials
            </Menu.Item>
            <Menu.Item key="sessions">
              <Icons.NumberOutlined />
              Sessions
            </Menu.Item>
          </Menu>
          <div>{this.renderChildren()}</div>
        </h2>
      </div>
    )
  }
}


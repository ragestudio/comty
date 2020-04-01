import React from 'react'
import { AppInfo } from 'ycore'
import styles from './index.less'
import classnames from 'classnames'

import * as antd from 'antd'
import * as Icons from '@ant-design/icons'

import { RegistrationForm } from './register.js'
import { NormalLoginForm } from './login.js'

import { siteName } from 'config'

export function transitionToogle() {
  window.LoginComponent.setState({
    transition: !window.LoginComponent.state.transition,
  })
  window.LoginComponent.toogleYulioID()
}

class Login extends React.PureComponent {
  constructor(props) {
    super(props)
    window.LoginComponent = this
    this.state = {
      transition: false,
      using: 1,
    }
  }
  switchType = {
    f: a => {
      this.setState({ using: a })
    },
    login: () => {
      this.switchType.f(1)
    },
    register: () => {
      this.switchType.f(2)
    },
    forgot: () => {
      this.switchType.f(3)
    },
  }

  renderType(t) {
    const a = this.state.using
    if (t) {
      switch (a) {
        case 1:
          return `Sign in ${siteName}`
        case 2:
          return 'Register'
        case 3:
          return 'Forgot'
        default:
          return 'Auth'
      }
    } else {
      switch (a) {
        case 1:
          return <NormalLoginForm />
        case 2:
          return <RegistrationForm />
        case 3:
          return null
        default:
          return <NormalLoginForm />
      }
    }
  }

  renderHelperButtons = () => {
    if (this.state.using == 1) {
      return (
        <div className={styles.login_helper_footer}>
          <antd.Button type="link" onClick={() => this.switchType.forgot()}>
            Forgotten password
          </antd.Button>
          <antd.Button type="link" onClick={() => this.switchType.register()}>
            Create an account
          </antd.Button>
        </div>
      )
    }
    if (this.state.using == 2 || 3) {
      return (
        <div className={styles.login_helper_footer}>
          <antd.Button type="link" onClick={() => this.switchType.login()}>
            Login
          </antd.Button>
        </div>
      )
    }
  }

  render() {
    return (
      <div
        className={classnames(styles.login_wrapper, {
          [styles.goOut]: this.state.transition,
        })}
      >
        <div
          style={{
            fontSize: '8px',
            position: 'absolute',
            top: '12px',
            left: '12px',
          }}
        >
        ⚠ Using v{AppInfo.version} {AppInfo.stage}
        </div>

        <div className={styles.login_wrapper}>
          <div className={styles.auth_box}>
            <div className={styles.left_body}>
              <h6>
                <img className={styles.yid_logo} src={'https://api.ragestudio.net/id.svg'} /> YulioID&trade;
              </h6>
              <h2> {this.renderType(true)} </h2>
            </div>
            <div className={styles.right_body}>
              {this.renderType()}
              {this.renderHelperButtons()}
            </div>
          </div>
        </div>
      </div>
    )
  }
}
export default Login

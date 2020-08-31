import React from 'react'
import { app_info, iatToString } from 'core'
import { router } from 'core/cores/router'
import { notify } from 'core/libs/interface/notify'

import styles from './index.less'
import classnames from 'classnames'

import * as antd from 'antd'
import * as Icons from 'components/Icons'

import { RegistrationForm } from './register.js'
import { NormalLoginForm } from './login.js'
import GuestSession from './guest.js'

import { app_config } from 'config'

export function transitionToogle() {
  window.LoginComponent.setState({
    transition: !window.LoginComponent.state.transition,
  })
  window.LoginComponent.toogleYulioID()
}
import { connect } from 'umi'

@connect(({ app }) => ({ app }))
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
    guest: () => {
      this.switchType.f(4)
    }
  }

  renderType(t) {
    const a = this.state.using
    if (t) {
      switch (a) {
        case 1:
          return `Sign in ${app_config.siteName}`
        case 2:
          return 'Register'
        case 3:
          return 'Forgot'
        case 4: 
          return 'Guest'
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
        case 4: 
          return <GuestSession />
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
          <antd.Button type="link" onClick={() => this.switchType.guest()}>
            Use guest session 
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

  componentDidMount(){
    if (this.props.app.session_valid) {
      notify.info('You have already logged into an account, you can change your account by logging in again')
    }
  }
  
  componentWillUnmount(){
    antd.Modal.destroyAll()
  }

  render() {
    const dispatchLogout = () => this.props.dispatch({ type: "app/logout" })
    
    const openAccountModal = () => {
      antd.Modal.confirm({
        title: this.props.app.session_data.username,
        icon:  <antd.Avatar src={this.props.app.session_data.avatar} />,
        content: 'Some descriptions',
        onOk() {
          router.push('/')
        },
        onCancel() {
          dispatchLogout()
        },
        okText: <><Icons.Home/>Resume</>,
        cancelText: <><Icons.Trash/>Logout</>
      });
    }
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
        ⚠ Using v{app_info.version} {app_info.stage}
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
            {this.props.app.session_authframe?
              <div className={styles.third_body}>
                <div className={styles.last_auth} onClick={() => openAccountModal()}>
                  <h4><antd.Avatar size="small" src={this.props.app.session_data.avatar} /> @{this.props.app.session_data.username}</h4>
                  <h5><Icons.Clock/>Last login  <antd.Tag>{iatToString(this.props.app.session_authframe.iat || 0)}</antd.Tag></h5>
                </div>
              </div>
            : null}
          </div>
        </div>
      </div>
    )
  }
}
export default Login

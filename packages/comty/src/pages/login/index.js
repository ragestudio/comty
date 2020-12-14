import React from 'react'
import { iatToString } from 'core'
import { router, ui } from 'core/libs'

import styles from './index.less'
import classnames from 'classnames'

import * as antd from 'antd'
import * as Icons from 'components/Icons'

import RegistrationForm from './register.js'
import NormalLoginForm from './login.js'
import GuestSession from './guest.js'

import { app } from 'config'
import { connect } from 'umi'

const types = [
  {
    id: "login",
    key: 0,
    renderText: `Sign in ${app.siteName}`
  },
  {
    id: "register",
    key: 1,
    renderText: "Register"
  },
  {
    id: "guest",
    key: 2,
    renderText: "Use guest session"
  },
  {
    id: "forgot",
    key: 3,
    renderText: "Forgotten password"
  },
]

const typesRenderMap = {
  0: <NormalLoginForm />,
  1: <RegistrationForm />,
  2: <GuestSession />
}

@connect(({ app }) => ({ app }))
class Login extends React.Component {
  state = {
    transition: false,
    key: 0,
  }

  renderHelperButtons() {
    return types.map((e) => {
      return (
        <antd.Button key={e.key} type="link" onClick={() => this.setState({ key: e.key })}>
          {e.renderText || "Invalid"}
        </antd.Button>
      )
    })
  }

  componentDidMount() {
    if (this.props.app.session_valid) {
      ui.notify.info('You have already logged into an account, you can change your account by logging in again')
    }
  }

  componentWillUnmount() {
    antd.Modal.destroyAll()
  }

  renderAccountModal() {
    const dispatchLogout = () => this.props.dispatch({ type: "app/logout" })
    antd.Modal.confirm({
      title: this.props.app.session_data.username,
      icon: <antd.Avatar src={this.props.app.session_data.avatar} />,
      onOk() {
        router.push('/')
      },
      onCancel() {
        dispatchLogout()
      },
      okText: <><Icons.Home />Resume</>,
      cancelText: <><Icons.Trash />Logout</>
    })
  }

  renderAccountCard() {
    if (this.props.app.session_authframe) {
      return (
        <div className={styles.third_body}>
          <div className={styles.last_auth} onClick={() => this.renderAccountModal()}>
            <h4><antd.Avatar size="small" src={this.props.app.session_data.avatar} /> @{this.props.app.session_data.username}</h4>
            <h5><Icons.Clock />Last login  <antd.Tag>{iatToString(this.props.app.session_authframe.iat || 0)}</antd.Tag></h5>
          </div>
        </div>
      )
    }
    return null
  }

  renderTitle() {
    return (
      <div>
        <h6><img className={styles.yid_logo} src={'https://api.ragestudio.net/id.svg'} /> YulioID&trade;</h6>
        <h2>{types[this.state.key].renderText || "Auth"}</h2>
      </div>
    )
  }

  render() {
    return (
      <div className={styles.login_wrapper}>
          <div className={styles.auth_box}>
            <div className={styles.left_body}>
              {this.renderTitle()}
            </div>
            <div className={styles.right_body}>
              {typesRenderMap[this.state.key]}
              <div className={styles.login_helper_footer}>
                {this.renderHelperButtons()}
              </div>
            </div>
            {this.renderAccountCard()}
          </div>
      </div>
    )
  }
}
export default Login

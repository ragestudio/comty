import React from 'react'
import styles from './index.less'

import Fade from 'react-reveal/Fade'
import HeadShake from 'react-reveal/HeadShake';

import * as antd from 'antd'

import { session, user } from 'core/models'

import verbosity from 'core/libs/verbosity'

import { Form, Input, Button, Checkbox } from 'antd'
import {
  UserOutlined,
  LockOutlined,
  BulbOutlined,
  SwapLeftOutlined
} from 'components/Icons'
import { connect } from 'umi'

@connect(({ app, socket }) => ({ app, socket }))
export class NormalLoginForm extends React.Component {
  state = {
    usernameRaw: null,
    passwordRaw: null,

    step: 1,
    validating: false,
    error_count: 0,
    step_error: false,
    step_show: true,
  }

  next() {
    let step = this.state.step
    this.setState({ validating: true, step_error: false })
    switch (step) {
      case 1: {
        if (this.state.usernameRaw) {
          const payload = { username: this.state.usernameRaw }
          user.get.basicData(payload, (err, res) => {
            if (res.code == 200) {
              step++
              this.anim_transition(300)
              return this.setState({
                validating: false,
                early_data: res.response,
                step: step,
              })
            }
            if (res.code == 210) {
              return this.anim_error()
            }
            return false
          })
        } else {
          return this.anim_error()
        }
      }
      case 2: {
        return this.auth()
      }

      default:
        return false
    }
  }

  back() {
    let a = this.state.step
    if (a > 1) {
      a--
      this.anim_transition(150)
    }

    this.setState({ step: a })
  }

  anim_transition(duration) {
    this.setState({ step_show: false })
    setTimeout(() => {
      this.setState({ step_show: true })
    }, duration || 1000)
  }

  anim_error() {
    this.setState({ step_error: true, error_count: (this.state.error_count + 1), validating: false })
  }

  auth() {
    const { usernameRaw, passwordRaw } = this.state
    if (!usernameRaw || !passwordRaw) return false
    this.setState({ step_error: false, validating: true })

    this.props.dispatch({
      type: 'app/login',
      payload: { username: usernameRaw, password: passwordRaw },
      callback: (callbackResponse) => {
        this.setState({ validating: false })
        switch (callbackResponse) {
          case 100: {
            return null
          }
          case 400: {
            console.log('Credentials error')
            return this.anim_error()
          }
          case 500: {
            console.log('Server error')
            return this.back()
          }
          default: {
            console.log('Unknown error')
            return this.back()
          }
        }
      }
    })
  }

  renderFormItems = {
    username: () => {
      return (
        <Form.Item
          name="username"
          hasFeedback
          help={this.state.step_error ? "It seems that this user does not exist" : null}
          validateStatus={this.state.step_error ? 'error' : this.state.validating ? 'validating' : null}
          rules={[
            {
              required: true,
              message: 'Please use your Username or Email!',
            },
          ]}
        >
          <Input
            autoFocus
            disabled={this.state.validating}
            onPressEnter={() => this.next()}
            onChange={(e) => { this.setState({ usernameRaw: e.target.value }) }}
            prefix={<UserOutlined className="site-form-item-icon" />}
            placeholder="Username or Email"
          />
        </Form.Item>
      )
    },
    password: () => {
      return (
        <>
          <h4><antd.Avatar shape='square' src={this.state.early_data.avatar} /> Welcome Back @{this.state.early_data.username}</h4>
          <Form.Item
            name="password"
            hasFeedback
            help={this.state.step_error ? "Incorrect password" : null}
            validateStatus={this.state.step_error ? 'error' : this.state.validating ? 'validating' : null}
            rules={[
              { required: true, message: 'Please input your Password!' },
            ]}
          >
            <Input.Password
              autoFocus
              onPressEnter={() => this.next()}
              disabled={this.state.validating}
              prefix={<LockOutlined className="site-form-item-icon" />}
              onChange={(e) => { this.setState({ passwordRaw: e.target.value }) }}
              placeholder="Password"
            />
          </Form.Item>
        </>
      )
    }
  }

  renderAuthForm() {
    return (
      <Form
        name="signin"
        className="login-form"
      >
        <HeadShake spy={this.state.error_count}>
          {this.renderFormItems[this.state.step == 1 ? "username" : "password"]()}
        </HeadShake>

      </Form>
    )
  }

  renderButtons() {
    const PrimaryButton = () => {
      return (
        <Button
          style={{ marginRight: "5px" }}
          type="primary"
          className="login-form-button"
          onClick={() => this.next()}
        >
          {this.state.step == 1 ? "Next" : "Login"}
        </Button>
      )
    }

    const SecondaryButton = () => {
      return (
        <Button
          style={{ marginRight: "5px" }}
          className="login-form-button"
          onClick={() => this.back()}
        >
          Back
        </Button>
      )
    }
    if (this.state.step > 1) {
      return <div><SecondaryButton /><PrimaryButton /></div>
    }
    return <PrimaryButton />
  }

  render() {
    return (
      <div className={styles.login_form}>
        <Fade left opposite when={this.state.step_show}>
          {this.renderAuthForm()}
        </Fade>
        {this.renderButtons()}
      </div>
    )
  }
}

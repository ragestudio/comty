import React from 'react'
import styles from './index.less'

import Fade from 'react-reveal/Fade'
import HeadShake from 'react-reveal/HeadShake';

import * as antd from 'antd'

import { session, user } from 'core/cores'

import verbosity from 'core/libs/verbosity'

import { Form, Input, Button, Checkbox } from 'antd'
import {
  UserOutlined,
  LockOutlined,
  BulbOutlined,
  SwapLeftOutlined
} from 'components/Icons'
import { connect } from 'umi'

@connect(({ app }) => ({ app }))
export class NormalLoginForm extends React.PureComponent {
  state = {
    activeForm: true,
    step: 1,
    validating: false,
    error_count: 0,
    step_error: false,
    step_show: true,
    swpass: false,
  }
  
  next = values => {
    let a = this.state.step
    const b = btoa(Object.values(values).toString())
    switch (a) {
      case 1:
        const payload = { username: Object.values(values).toString() }
        user.get.profileData(payload, (err, res) => {
          if (err || !res) return false
          try {
            const res_data = JSON.parse(res)

            if (res_data.api_status == 200) {
              a++
              this.anim_transition(300)
              this.setState({
                step_error: false,
                early_data: res_data.data,
                form_rawd_1: b,
                step: a,
              })
            }
            if (res_data.api_status == 400) {
               this.anim_error()
            }
          } catch (error) {
            return false
          }
        })

        return true
      case 2:
        this.setState({ form_rawd_2: b, step: a })
        this.auth()
        return true
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
    this.setState({ step_error: true, error_count: (this.state.error_count + 1) })
  }

  anim_close() {
    this.setState({ step_show: false })
  }


  getAuthFrame(payload) {
    return new Promise(resolve => {
        session.auth(payload, (err, res) => {
            if (err) {
                
            }
            if (res) {
                try {
                    res = JSON.parse(res)
                    verbosity.log(res)
                } catch (error) {
                    console.log('Invalid response!')
                }

                switch (res.api_status.toString()) {
                    case "200": {
                        try {
                            return resolve(res)
                        } catch (error) {
                            verbosity.error(error)
                        }
                        break;
                    }
                    case "400": {
                        console.log('Credentials error')
                        this.setState({ validating: false })
                        return this.anim_error()
                    }
                    case "500": {
                        console.log('Server error')
                        this.setState({ validating: false })
                        return this.back()
                    }
                    default: {
                        console.log('Unknown error')
                        this.setState({ validating: false })
                        return this.back()
                    }
                }
                
            }
        })
    });
  }

  getDataFrame(payload) {
    return new Promise(resolve => {
        user.get.data(payload, (err, res) => {
            if(err) {
    
            }
            if (res) {
                try {
                    return resolve(JSON.stringify(JSON.parse(res)['user_data']))
                } catch (error) {
                    verbosity.error(error)
                }
            }
        })
    
    })
  }

  async auth() {
    const { form_rawd_1, form_rawd_2 } = this.state
    if (!form_rawd_1 || !form_rawd_2) return false
    this.setState({ step_error: false, validating: true })
    
    const authFrame = await this.getAuthFrame({username: form_rawd_1, password: form_rawd_2, server_key: this.props.app.server_key})
    const dataFrame = await this.getDataFrame({id: authFrame.user_id, access_token: authFrame.access_token, serverKey: this.props.app.server_key})

    return this.props.dispatch({
        type: 'app/login',
        payload: {authFrame, dataFrame}
    });
  }

  renderState = () => {
    switch (this.state.step) {
      case 1:
        return (
          <Form
            name="signin_username"
            className="login-form"
            onFinish={this.next}
          >
            <h5>
              <BulbOutlined /> You can use your YulioID account to login
            </h5>
            <HeadShake spy={this.state.error_count}>
            <Form.Item
              name="username"
              hasFeedback
              help={this.state.step_error? "It seems that this user does not exist" : null}
              validateStatus={this.state.step_error? 'error' : this.state.validating? 'validating' : null}
              rules={[
                {
                  required: true,
                  message: 'Please use your Username or Email!',
                },
              ]}
            >
              <Input
                prefix={<UserOutlined className="site-form-item-icon" />}
                placeholder="Username or Email"
              />
            </Form.Item>
            </HeadShake>
            <Button
              type="primary"
              htmlType="submit"
              className="login-form-button"
            >
              Next
            </Button>
          </Form>
        )
      case 2:
        return (
          <Form
            name="signin_password"
            className="login-form"
            onFinish={this.next}
          >

            <h4><antd.Avatar shape='square' src={this.state.early_data.avatar} /> Welcome Back @{this.state.early_data.username}</h4>
            <HeadShake spy={this.state.error_count}>
            <Form.Item
              name="password"
              hasFeedback
              help={this.state.step_error? "Incorrect password" : null}
              validateStatus={this.state.step_error? 'error' : this.state.validating? 'validating' : null}
              rules={[
                { required: true, message: 'Please input your Password!' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="site-form-item-icon" />}
                type={this.state.swpass ? 'text' : 'password'}
                placeholder="Password"
              />
            </Form.Item>
            </HeadShake>
            <div className={styles.helper_login_btn}>
              <antd.Button
                icon={<SwapLeftOutlined />}
                type="link"
                onClick={() => this.back()}
              >
                Back
              </antd.Button>
              <Button
                type="primary"
                htmlType="submit"
                className="login-form-button"
              >
                Login
              </Button>
            </div>
          </Form>
        )
      case 3: {
        return <h3>Wait a sec...</h3>
      }
      default:
        return null
    }
  }

  render() {
    return (
      <div className={styles.login_form}>
        <Fade left opposite when={this.state.step_show}>
          {this.state.activeForm? this.renderState() : <div><h4>Mmm, this is taking longer than it should...</h4></div>}
        </Fade>
      </div>
    )
  }
}

import React from 'react'
import * as Icons from 'components/Icons'
import styles from './index.less'

import {
  Form,
  Input,
  Tooltip,
  Cascader,
  Select,
  Row,
  Col,
  Checkbox,
  Button,
  AutoComplete,
} from 'antd'

import ReCAPTCHA from 'react-google-recaptcha'
import { g_recaptcha_key } from 'config/app_keys'

export default class RegistrationForm extends React.Component {
  state = {
    usernameRaw: null,
    passwordRaw: null,
    emailRaw: null,

    captchaValue: null
  }
  
  handleRegister() {

  }

  onFinish(values) {
    console.log('Received values of form: ', values)
  }

  onCaptcha(values) {
    this.setState({ captchaValue: values })
  }

  onChangeField(event) {
    if(!this.state) {
      return false
    }
    let updated = this.state
    updated[event.target.id] = event.target.value
    this.setState(updated)
  }

  renderForm() {
    return (
      <Form
        name="register"
        className={styles.register_form}
        onFinish={this.onFinish}
        scrollToFirstError
      >
        <Form.Item
          name="username"
          rules={[
            {
              required: true,
              message: 'Please input your username!',
              whitespace: true,
            },
          ]}
        >
          <Input id="usernameRaw" onChange={(e) => this.onChangeField(e)} placeholder="randomuser" prefix={<Icons.TagOutlined />} />
        </Form.Item>
        <Form.Item
          name="email"
          rules={[
            {
              type: 'email',
              message: 'The input is not valid E-mail!',
            },
            {
              required: true,
              message: 'Please input your E-mail!',
            },
          ]}
        >
          <Input id="emailRaw" onChange={(e) => this.onChangeField(e)} placeholder="example@no-real.com" prefix={<Icons.Mail />} />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[
            {
              required: true,
              message: 'Please input your password!',
            },
          ]}
          hasFeedback
        >
          <Input.Password id="passwordRaw" onChange={(e) => this.onChangeField(e)} placeholder="mysupersecretpassword" prefix={<Icons.Lock />} />
        </Form.Item>

        <Form.Item extra="We must make sure that your are a human.">
          <Row gutter={8}>
            <Col span={12}>
              <Form.Item
                name="captcha"
                noStyle
                rules={[
                  {
                    required: true,
                    message: 'Please complete the captcha!',
                  },
                ]}
              >
                <ReCAPTCHA sitekey={g_recaptcha_key} onChange={this.onCaptcha} />
              </Form.Item>
            </Col>
            <Col span={12}></Col>
          </Row>
        </Form.Item>

        <Form.Item
          name="agreement"
          valuePropName="checked"
          rules={[
            {
              validator: (_, value) =>
                value
                  ? Promise.resolve()
                  : Promise.reject('Should accept agreement'),
            },
          ]}
        >
          <Checkbox>
            I have read the <a>agreement</a>
          </Checkbox>
        </Form.Item>
        <Form.Item >
          <Button type="primary"> Register </Button>
        </Form.Item>
      </Form>
    )
  }

  render() {
    return (
      <div className={styles.centering_wrapper}>
        { this.renderForm()}
      </div>
    )
  }

}

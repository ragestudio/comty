import React, { useState } from 'react'
import {
  MailOutlined,
  TagOutlined,
  LockOutlined,
} from '@ant-design/icons'

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
import { QuestionCircleOutlined } from '@ant-design/icons'
import ReCAPTCHA from 'react-google-recaptcha'
import { g_recaptcha_key } from 'config'

function capchaOnChange(value) {
  console.log('Captcha value:', value)
}



export const RegistrationForm = () => {

  const onFinish = values => {
    console.log('Received values of form: ', values)
  }

  return (
    <div className={styles.centering_wrapper}> 
    <Form
     
      name="register"
      className={styles.register_form}
      onFinish={onFinish}
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
        <Input prefix={<TagOutlined />}
          placeholder="ramdomuser"/>
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
        <Input
          prefix={<MailOutlined />}
          placeholder="example@no-real.com"
        />
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
        <Input.Password   prefix={<LockOutlined />}
          placeholder="example@no-real.com"/>
      </Form.Item>

      <Form.Item
        name="confirm"
        dependencies={['password']}
        hasFeedback
        rules={[
          {
            required: true,
            message: 'Please confirm your password!',
          },
          ({ getFieldValue }) => ({
            validator(rule, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve()
              }

              return Promise.reject(
                'The two passwords that you entered do not match!'
              )
            },
          }),
        ]}
      >
        <Input.Password   prefix={<LockOutlined />}
          placeholder="example@no-real.com"/>
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
              <ReCAPTCHA sitekey={g_recaptcha_key} onChange={capchaOnChange} />
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
          I have read the <a href="">agreement</a>
        </Checkbox>
      </Form.Item>
      <Form.Item >
        <Button type="primary" htmlType="submit">
          Register
        </Button>
      </Form.Item>
    </Form>
    </div>
  )
}

import React from 'react'
import store from 'store'

import { enquireScreen, unenquireScreen } from 'enquire-js'

import * as antd from 'antd'

import styles from './PublicLayout.less'

const { Content } = antd.Layout

export default class PublicLayout extends React.Component {
  constructor(props) {
    super(props)
    window.PrimaryComponent = this
    this.state = {
      isMobile: false,
    }
  }

  componentDidMount() {
    this.enquireHandler = enquireScreen(mobile => {
      const { isMobile } = this.state
      if (isMobile !== mobile) {
        this.setState({
          isMobile: mobile,
        })
        store.set('mobile_src', mobile)
      }
    })
  }

  componentWillUnmount() {
    unenquireScreen(this.enquireHandler)
  }


  render() {
    const { children } = this.props
    return (
      <React.Fragment>
          <antd.Layout>
            <div className={styles.primary_layout_container}>
                <Content
                  id="publicContent"
                  className={styles.primary_layout_content}
                >
                  {children}
                </Content>
            </div>
          </antd.Layout>
      </React.Fragment>
    )
  }
}
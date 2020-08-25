import React from 'react'
import store from 'store'

import {
  MyLayout,
  PageTransition,
} from 'components'
import { enquireScreen, unenquireScreen } from 'enquire-js'
import classnames from 'classnames'

import * as antd from 'antd'
import * as Icons from 'components/Icons'

import styles from './PrimaryLayout.less'

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
    const { isMobile } = this.state
    return (
      <React.Fragment>
          <antd.Layout id="publicLayout" className={classnames(styles.primary_layout, {[styles.mobile]: isMobile})}>
            <div className={styles.primary_layout_container}>
              <PageTransition
                preset="moveToRightScaleUp"
                transitionKey={window.location.pathname}
              >
                <Content
                  id="publicContent"
                  className={styles.primary_layout_content}
                >
                  {children}
                </Content>
              </PageTransition>
            </div>
          </antd.Layout>
      </React.Fragment>
    )
  }
}
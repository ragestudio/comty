import React from 'react'
import styles from './index.less'
import * as antd from 'antd'
import { booleanFix } from 'core'

export default class UserBadges extends React.Component {
  render() {
    const { values } = this.props
    return (
      <div className={styles.TagWrappers}>
        {booleanFix(values.nsfw_flag) ? (
          <antd.Tag color="volcano">NSFW</antd.Tag>
        ) : null}
        {booleanFix(values.is_pro) ? (
          <antd.Tag color="purple">
            CPRO™ <Icons.RocketOutlined />
          </antd.Tag>
        ) : null}
        {booleanFix(values.dev) ? (
          <antd.Tag color="default">
            DEVELOPER <Icons.CodeOutlined />
          </antd.Tag>
        ) : null}
      </div>
    )
  }
}

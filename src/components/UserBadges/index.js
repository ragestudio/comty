import React from 'react'
import styles from './index.less'
import * as antd from 'antd'
import * as app from 'app'
import { BadgesType } from 'globals/badges_list'

export default class UserBadges extends React.Component {
  render() {
    const { values } = this.props
    console.log(BadgesType)
    return (
      <div className={styles.TagWrappers}>
        {app.booleanFix(values.nsfw_flag) ? (
          <antd.Tag color="volcano">NSFW</antd.Tag>
        ) : null}
        {app.booleanFix(values.is_pro) ? (
          <antd.Tag color="purple">
            CPRO™ <Icons.RocketOutlined />
          </antd.Tag>
        ) : null}
        {app.booleanFix(values.dev) ? (
          <antd.Tag color="default">
            DEVELOPER <Icons.CodeOutlined />
          </antd.Tag>
        ) : null}
      </div>
    )
  }
}

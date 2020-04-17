import React from 'react'
import * as ycore from 'ycore'
import * as Icons from '@ant-design/icons'
import styles from './index.less'

export default class NotificationView extends React.Component {
  render() {
    return (
      <div className={styles.main}>
        <h2>
          <Icons.NotificationOutlined /> Notifications
        </h2>
      </div>
    )
  }
}


import React from 'react'
import * as app from 'app'
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


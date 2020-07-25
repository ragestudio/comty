import React from 'react'
import * as Icons from 'components/Icons'
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


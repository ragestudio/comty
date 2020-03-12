import React from 'react';
import * as ycore from "ycore"
import * as Icons from '@ant-design/icons'
import styles from './notification.less'


class NotificationView extends React.Component {
  render() {
    return (
      <div className={styles.main}>
        <h2><Icons.NotificationOutlined /> Notifications</h2>
      </div>
    )
  }
}

export default NotificationView;

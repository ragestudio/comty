import React from 'react';
import * as ycore from "ycore"
import * as Icons from '@ant-design/icons'
import styles from './security.less'

class SecurityView extends React.Component {
  render() {
    return (
      <div className={styles.main}>
        <h2><Icons.LockOutlined /> Your Security & Privacy</h2>
      </div>
    )
  }
}

export default SecurityView;

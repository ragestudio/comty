import React from 'react'
import { Icon } from 'antd'
import { Page } from 'components'
import styles from './404.less'

const Error = () => (
  <Page inner>
    <div className={styles.error}>
    <Icon type="api" />
      <h1>OBA BLYAT</h1>
      <p><strong>ERROR 404</strong></p>
    </div>
  </Page>
)

export default Error

import React from 'react'
import { Icon as LegacyIcon } from '@ant-design/compatible';
import { Page } from 'components'
import styles from './404.less'

const Error404 = () => (
  <Page inner>
    <div className={styles.error}>
    <LegacyIcon type="api" />
      <h1>OBA BLYAT</h1>
      <p><strong>ERROR 404</strong></p>
    </div>
  </Page>
)

export default Error404

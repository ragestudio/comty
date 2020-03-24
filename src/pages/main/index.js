import React from 'react'
import * as ycore from 'ycore'
import { PostCreator, MainFeed } from 'components'
import styles from './index.less'

export default class Main extends React.Component {
  render() {
    return (
      <div className={styles.mainWrapper}>
        <PostCreator userData={ycore.userData()} />
        <MainFeed get="feed" />
      </div>
    )
  }
}

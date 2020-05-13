import React from 'react'
import * as app from 'app'
import { PostCreator, MainFeed } from 'components'
import styles from './index.less'

export default class Main extends React.Component {
  render() {
    return (
      <>
        <PostCreator userData={app.userData()} />
        <MainFeed auto={true} get="feed" />
      </>
    )
  }
}

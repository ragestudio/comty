import React from 'react'
import styles from './__priPost.less'

import * as antd from 'antd'
import * as app from 'app'
import * as Icons from 'components/Icons'
import Icon from '@ant-design/icons'

import { MediaPlayer, PostCard } from 'components'

export default class __priPost extends React.PureComponent {

    render() {
      const {payload} = this.props
      if (!payload) {
        return <h1>This post not exists!!!</h1>
      }
      const { id, postText, postFile_full, post_time, publisher } = payload
      const {isMobile}= this.props
  
      return (
        <div className={styles.contentWrapper}>
          <div className={styles.contentBody}>
            <PostCard id="post_card" payload={payload} key={id} />
          </div>
        </div>
      )
    }
  }
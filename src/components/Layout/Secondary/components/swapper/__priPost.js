import React from 'react'
import styles from './__priPost.less'

import * as antd from 'antd'
import * as app from 'app'
import * as Icons from '@ant-design/icons'
import Icon from '@ant-design/icons'

import { MediaPlayer } from 'components'

const VerifiedBadge = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="#55acee"
      width="15"
      height="15"
      viewBox="0 0 24 24"
    >
      <path d="M23 12l-2.44-2.78.34-3.68-3.61-.82-1.89-3.18L12 3 8.6 1.54 6.71 4.72l-3.61.81.34 3.68L1 12l2.44 2.78-.34 3.69 3.61.82 1.89 3.18L12 21l3.4 1.46 1.89-3.18 3.61-.82-.34-3.68L23 12m-13 5l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"></path>
    </svg>
  )

export default class __priPost extends React.PureComponent {
    renderContent(payload) {
      const { id, postText, postFile_full, post_time, publisher } = payload
      const {isMobile}= this.props
  
      return (
        <div className={styles.contentWrapper}>
          {postFile_full ? <MediaPlayer isMobile={isMobile} entire={true} file={postFile_full} /> : null}
        </div>
      )
    }
  
    render() {
      const {payload} = this.props
      if (!payload) {
        return <h1>This post not exists!!!</h1>
      }
      const { id, postText, postFile_full, post_time, publisher } = payload
      return (
        <div className={styles.render_component}>
          <div className={styles.UserContainer}>
            <div className={styles.UserContainer_text}>
              <h4 className={styles.titleUser}>
                {publisher.username}{' '}
                {app.booleanFix(publisher.verified) ? (
                  <Icon style={{ color: 'blue' }} component={VerifiedBadge} />
                ) : null}
              </h4>
              <p>
                {post_time} {app.IsThisUser.dev() ? `| #${id}` : null}{' '}
              </p>
            </div>
            <antd.Avatar shape="square" size={50} src={publisher.avatar} />
          </div>
          {this.renderContent(payload)}
        </div>
      )
    }
  }
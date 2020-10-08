import React from 'react'
import styles from './index.less'
import classnames from 'classnames'

const FollowButton = (props) => {
  return (
    <a className={classnames(styles.button, {[styles.disabled]: !props.followed })}>
      <span>{props.followed ? 'Following' : 'Follow'}</span>
    </a>
  )
}

export default FollowButton

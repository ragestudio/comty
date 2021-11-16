import React from 'react'
import classNames from 'classnames'
import styles from './index.less'

const Loader = (loading) => {
  return (
      <div className={classNames(styles.wrapper, {[styles.end]: !loading })}>
        <div
          className={styles.newloader}
        >
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
       
      </div>

  )
}


export default Loader

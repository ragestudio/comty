import React from 'react'
import classNames from 'classnames'
import styles from './Loader.less'

const Loader = (loading) => {
  return (
      <div className={classNames(styles.wrapper, {[styles.end]: !loading })}>
        <span>Loading... </span>
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

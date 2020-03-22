import React from 'react'
import {CoreLoader} from 'components'
import { AppSettings } from 'ycore'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import styles from './Loader.less'

const Loader = ({ spinning = true, fullScreen }) => {
  if (AppSettings.InfiniteLoading == true) {
    return (
      <div className={styles.loader}>
        <div className={styles.warpper}>
          <div className={styles.newloader}>
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
      </div>
    )
  }
  return (
    <div
      className={classNames(styles.loader, {
        [styles.hidden]: !spinning,
        [styles.fullScreen]: fullScreen,
      })}
    >
      <div className={styles.warpper}>
      <div className={classNames(styles.newloader, {[styles.end]: !spinning}) }>
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
    </div>
  )
}
Loader.propTypes = {
  spinning: PropTypes.bool,
  fullScreen: PropTypes.bool,
}

export default Loader;

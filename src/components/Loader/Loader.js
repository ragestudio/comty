import React from 'react'
import {CoreLoader} from 'components'
import { DevOptions } from 'ycore'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import styles from './Loader.less'

const Loader = ({ spinning = true, fullScreen }) => {
  if (DevOptions.InfiniteLoading == true) {
    return (
      <div className={styles.loader}>
        <div className={styles.warpper}>
          <CoreLoader type='circle' />
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
        <CoreLoader type='circle' />
      </div>
    </div>
  )
}
Loader.propTypes = {
  spinning: PropTypes.bool,
  fullScreen: PropTypes.bool,
}

export default Loader;

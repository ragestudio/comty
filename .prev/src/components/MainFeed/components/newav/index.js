import { Button } from 'antd'
import styles from './newav.less'
const ComponentNewAV = fn => {
  return (
    <div className={styles.main_feed_newav}>
      <Button onClick={fn}> New posts </Button>
    </div>
  )
}

export default ComponentNewAV 
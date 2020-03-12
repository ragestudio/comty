import React from 'react'
import * as antd from 'antd'
import * as ycore from 'ycore'
import {PostCreator, MainFeed} from 'components'
import styles from './index.less'

class Main extends React.Component {
  
 
    render(){
        return (
           <div className={styles.mainWrapper}>
                    <PostCreator />
                    <MainFeed get="feed" />
           </div>
        )
    }
}
export default Main;
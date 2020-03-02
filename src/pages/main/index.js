import React from 'react'
import * as antd from 'antd'
import * as ycore from 'ycore'
import {PostCreator, MainSidebar, MainFeed, MicroHeader} from 'components'
import styles from './index.less'
import { RefreshFeed } from 'components/MainFeed'
import { HandleVisibility } from 'components/PostCreator'
import { HandleShow } from 'components/MicroHeader'

const userData = ycore.SDCP()

class Main extends React.Component {
    constructor(props){
        super(props)
        this.state = {
        }
    }
 
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
import React from 'react'
import * as antd from 'antd'
import * as ycore from 'ycore'
import {PostCreator, MainSidebar, MainFeed, MicroHeader} from 'components'
import styles from './index.less'
import { RefreshFeed } from 'components/MainFeed'
import { HandleVisibility } from 'components/PostCreator'
import { HandleShow } from 'components/MicroHeader'

var userData = ycore.SDCP()

class Main extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            loading: true,
            createPost: true,
        }
    }
    render(){
        return (
            <div> 
                <PostCreator />
                <MainFeed get="feed" />
            </div>
        )
    }
}
export default Main;
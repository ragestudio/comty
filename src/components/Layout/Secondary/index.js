import React from 'react'
import * as ycore from 'ycore'
import * as antd from 'antd'
import * as Icons from '@ant-design/icons'
import styles from './index.less'
import classnames from 'classnames'

import SecRenderPost from './post'

export const SwapMode = {
    ext: () => {
        SecondaryLayoutComponent.setState({
            swap: true,
            mode: 'ext'
        })
    },
    PostComments: (e) => {
        SecondaryLayoutComponent.setState({
            swap: true,
            mode: 'post_comments',
            s_raw: e
        })
    },
    openPost: (e) => {
        SecondaryLayoutComponent.setState({
            swap: true,
            mode: 'open_post',
            s_raw: e
        })
    }
}

export default class Secondary extends React.PureComponent{
    constructor(props){
        super(props),
        window.SecondaryLayoutComponent = this;
        this.state = {
            swap: false,
            mode: 'ext',
            s_raw: '',
        }
    }
    closeSwap(){
        this.setState({ 
            swap: !this.state.swap,
            s_raw: null,
            mode: 'ext'
         })
    }
    renderPost = (payload) => {
        const post_data = JSON.parse(payload)['post_data']
        console.log(post_data)
        return(
           <SecRenderPost payload={post_data} />
        )
    }


    renderMode(){
        const { mode } = this.state
        switch (mode) {
            case 'ext':
                return (
                    <h1></h1>
                )
            case 'post_comments':{
                   return(
                      <PostComments s_raw={this.state.s_raw} />
                   ) 
               }
            case 'open_post':{
                return(
                    this.renderPost(this.state.s_raw)
                )
            }
        
            default:
                break;
        }
    }


    render(){
       const { userData } = this.props
        return(
            <div className={classnames(styles.SecondaryWrapper, {[styles.active]: this.state.swap })}> 
               
                <div className={styles.UserHeader}>
                  <div className={styles.notif_box}></div>
                  <img onClick={() => ycore.crouter.native(`@${userData.username}`)} src={userData.avatar} />
                </div>

                <div className={classnames(styles.container, {[styles.desktop_mode]: this.props.desktop_mode})} >
                    <div className={styles.container_body}>
                        {this.state.swap? <antd.Button type="ghost" icon={<Icons.LeftOutlined />} onClick={() => this.closeSwap()} > Back </antd.Button> : null}
                        {this.renderMode()}
                    </div>
                
                

                </div>

                <div className={classnames(styles.container_2, {[styles.active]: this.state.swap})}>
                    <h1>container_2</h1>
                </div> 
               
            
            </div>
        )
    }
}
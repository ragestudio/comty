import React from 'react'
import * as ycore from 'ycore'
import * as antd from 'antd'
import * as Icons from '@ant-design/icons'
import styles from './index.less'
import classnames from 'classnames'

import {__priPost, __secComments} from './renders.js'

export const SwapMode = {
    close: () => {
        SecondaryLayoutComponent.closeSwap()
    },
    openPost: (a, b) => {
        SecondaryLayoutComponent.setState({
            swap: true,
            mode: 'post',
            global_raw: a,
        })
    }
}

export default class Secondary extends React.PureComponent{
    constructor(props){
        super(props),
        window.SecondaryLayoutComponent = this;
        this.state = {
            swap: false,
            mode: '',
            global_raw: '',
            pri_raw: '',
            sec_raw: '',
        }
    }
    
    closeSwap(){
        this.setState({ 
            swap: !this.state.swap,
            pri_raw: null,
            sec_raw: null,
            mode: ''
         })
    }

    SwapBalanceContent(container){
        switch (container){
            case '__pri': {
                return this.__pri()
            }
            case '__sec': {
                return this.__sec()
            }
            default: return null
        }
    }

    __pri(){
        const dtraw = this.state.pri_raw;
        switch (this.state.mode){
            case 'post': {
                return this.renderPost(this.state.global_raw)
            }
            default: return null
        }
    }
    __sec(){
        const dtraw = this.state.sec_raw;
        switch (this.state.mode){
            case 'post': {
                return this.renderComments(this.state.global_raw)
            }
            default: return null
        }
    }

    renderPost = (payload) => {
        const post_data = JSON.parse(payload)['post_data']
        console.log(post_data)
        return(
           <__priPost payload={post_data} />
        )
    }

    renderComments = (payload) => {
        const post_comments = JSON.parse(payload)['post_comments']
        const post_data = JSON.parse(payload)['post_data']
        console.log(post_comments)
        return(
            <__secComments post_id={post_data.post_id} payload={post_comments} />
        )
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
                        {this.SwapBalanceContent('__pri')}
                    </div>
                </div>

                <div className={classnames(styles.container_2, {[styles.active]: this.state.swap})}>
                    {this.SwapBalanceContent('__sec')}
                </div> 
               
            
            </div>
        )
    }
}
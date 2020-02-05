import React from 'react'
import * as antd from 'antd'
import * as ycore from 'ycore'
import styles from './index.less'
import {CustomIcons} from 'components'

const { Meta } = antd.Card;

// Set default by configuration
const emptyPayload = {user: 'Post Empty', ago: 'This Post is empty', avatar: 'https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png', content: 'Test Test' }
const defaultActions = [<antd.Icon type="heart"  className={styles.likebtn} key="like" />,<antd.Icon type="share-alt" key="share" />,<antd.Icon type="more" key="actionMenu" />]

class PostCreator extends React.PureComponent{
    constructor(props){
        super(props),
        this.state = {
            FadeIN: true,
            keys_remaining: '512'
        }
    }

    renderPostPlayer(payload){
        const ident = payload
        if (ident.includes('.mp4')) {
           return (
                <video id="player" playsinline controls > 
                     <source src={payload} type="video/mp4"/>
                </video>
           )
        }
        if (ident.includes('.webm')) {
            return (
                <video id="player" playsinline controls > 
                     <source src={payload} type="video/webm"/>
                </video>
           )
        }
        if (ident.includes('.mp3')){
            return (
                <audio id="player" controls>
                    <source src={payload} type="audio/mp3" />
                </audio>
            )
        }
        if (ident.includes('.ogg')){
            return (
                <audio id="player" controls>
                    <source src={payload} type="audio/ogg" />
                </audio>
            )
        }
        else {
            return (
                <img src={payload} />
            )
        }
    }
    
    handleChanges = ({ target: { value } }) => {
        this.setState({ rawtext: value, keys_remaining: (ycore.DevOptions.MaxLengthPosts - value.length) })
        
    }
    handleKeysProgressBar(){
        const { keys_remaining } = this.state;
        if (keys_remaining <= 80) {
            return 'exception'
        }else return('active')
    }

    render(){
        const { keys_remaining, } = this.state;
        const percent = (((keys_remaining/ycore.DevOptions.MaxLengthPosts) * 100).toFixed(2) )
        return(
          <div className={styles.cardWrapper}>
             <antd.Card  >
                <Meta
                    avatar={<div className={styles.titleIcon}><antd.Icon type="plus" /></div>}
                    title={<div><h4 className={styles.titlecreate}>Create a post </h4></div>}
                    description={<span className={styles.shareWith}>Share with everyone</span>}
                    bordered="false"
                />
                <div className={styles.inputWrapper}>
                    <antd.Progress className={(keys_remaining < 512? styles.proccessSet : styles.proccessUnset)} status={this.handleKeysProgressBar()}  showInfo={false} percent={percent} />
                    <antd.Input.TextArea autoSize={{ minRows: 3, maxRows: 5 }} placeholder="What's going on?" onChange={this.handleChanges} allowClear maxLength={ycore.DevOptions.MaxLengthPosts} rows={4} />
                    
                </div>
                
            </antd.Card>
          </div>
        )
    }
}
export default PostCreator
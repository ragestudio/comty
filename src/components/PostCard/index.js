import React from 'react'
import * as antd from 'antd'
import styles from './index.less'
import {CustomIcons, LikeBTN} from 'components'
import * as ycore from 'ycore'
import * as Icons from '@ant-design/icons';
import Icon from '@ant-design/icons'

const { Meta } = antd.Card;

// Set default by configuration
const emptyPayload = {user: 'Post Empty', ago: 'This Post is empty', avatar: 'https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png', content: 'Test Test' }

class PostCard extends React.PureComponent{
    constructor(props){
        super(props),
        this.state = {
            FadeIN: true
        }
    }

    renderPostPlayer(payload){
        const ident = payload
        if (ident.includes('.mp4')) {
           return (
                <video id="player" playsInline controls > 
                     <source src={`${payload}`} type="video/mp4"/>
                </video>
           )
        }
        if (ident.includes('.webm')) {
            return (
                <video id="player" playsInline controls > 
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
    
    render(){
        const { payload, customActions,  } = this.props
        const { id, user, ago, avatar, content, file, postFileName, publisher, post_likes, is_post_pinned, is_liked } = payload || emptyPayload;
        const defaultActions = [<div><LikeBTN count={post_likes} id={id} liked={ycore.booleanFix(is_liked)? true : false} key="like" /></div>,<Icons.ShareAltOutlined key="share" />,<Icons.MoreOutlined key="actionMenu" />]
        const actions = customActions || defaultActions;
        return(
          <div className={styles.cardWrapper}>
             <antd.Card actions={actions} >
                <Meta
                    avatar={<div className={styles.postAvatar}><antd.Avatar shape="square" size={50} src={avatar} /></div>}
                    title={<div className={styles.titleWrapper} ><h4 onClick={() => ycore.crouter.native(`@${user}`)} className={styles.titleUser}>@{user} {ycore.booleanFix(publisher.verified)? <Icon style={{ color: 'blue' }} component={CustomIcons.VerifiedBadge} /> : null}{ycore.booleanFix(publisher.nsfw_flag)? <antd.Tag style={{ margin: '0 0 0 13px' }} color="volcano" >NSFW</antd.Tag> : null} </h4> <div className={styles.PostTags}>{ycore.booleanFix(is_post_pinned)? (<Icons.PushpinFilled /> ): null }</div> </div>}
                    description={<span className={styles.textAgo}>{ago}</span>}
                    bordered="false"
                />
                {content? <div className={styles.postContent}> <h3 dangerouslySetInnerHTML={{__html:  content }}  /> </div> : null}
                {file? <div className={styles.postContentFILE}>{this.renderPostPlayer(file)}</div> : null }
                <div className={styles.ellipsisIcon}><Icons.EllipsisOutlined /></div>
               
                
            </antd.Card>
          </div>
        )
    }
}
export default PostCard
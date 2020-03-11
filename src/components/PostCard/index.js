import React from 'react'
import * as antd from 'antd'
import styles from './index.less'
import {CustomIcons, LikeBTN} from 'components'
import * as ycore from 'ycore'
import * as Icons from '@ant-design/icons';
import Icon from '@ant-design/icons'
import classnames from 'classnames'
import * as MICON from '@material-ui/icons';

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
        const { payload, customActions } = this.props
        const ActShowMode = ycore.DevOptions.force_show_postactions
        const { id, post_time, postText, postFile, postFileName, publisher, post_likes, is_post_pinned, is_liked } = payload || emptyPayload;
        const defaultActions = [
            <div><LikeBTN count={post_likes} id={id} liked={ycore.booleanFix(is_liked)? true : false} key="like" /></div>,
            <MICON.InsertComment key="share" />,
            <div><antd.Dropdown overlay={MoreMenu} trigger={['click']}>
            <Icons.MoreOutlined key="actionMenu" />
            </antd.Dropdown></div>,
        ]
        const actions = customActions || defaultActions;
       
        const MoreMenu = (
            <antd.Menu>
              <antd.Menu.Item key="0">
                <a href="http://www.alipay.com/">1st menu item</a>
              </antd.Menu.Item>
              <antd.Menu.Item key="1">
                <a href="http://www.taobao.com/">2nd menu item</a>
              </antd.Menu.Item>
              <antd.Menu.Divider />
              <antd.Menu.Item key="3">3rd menu item</antd.Menu.Item>
            </antd.Menu>
          );

        return(
          <div className={styles.cardWrapper}>
             <antd.Card hoverable className={ActShowMode? styles.showMode : null} actions={actions} >
                <Meta
                    avatar={<div className={styles.postAvatar}><antd.Avatar shape="square" size={50} src={publisher.avatar} /></div>}
                    title={<div className={styles.titleWrapper} ><h4 onClick={() => ycore.crouter.native(`@${publisher.username}`)} className={styles.titleUser}>@{publisher.username} {ycore.booleanFix(publisher.verified)? <Icon style={{ color: 'blue' }} component={CustomIcons.VerifiedBadge} /> : null}{ycore.booleanFix(publisher.nsfw_flag)? <antd.Tag style={{ margin: '0 0 0 13px' }} color="volcano" >NSFW</antd.Tag> : null} </h4> <div className={styles.PostTags}>{ycore.booleanFix(is_post_pinned)? (<Icons.PushpinFilled /> ): null }</div> </div>}
                    description={<span className={styles.textAgo}>{post_time}</span>}
                    bordered="false"
                />
                {postText? <div className={styles.postContent}> <h3 dangerouslySetInnerHTML={{__html:  postText }}  /> </div> : null}
                {postFile? <div className={styles.postContentFILE}>{this.renderPostPlayer(postFile)}</div> : null }
                <div className={styles.ellipsisIcon}><Icons.EllipsisOutlined /></div>
               
                
            </antd.Card>
          </div>
        )
    }
}
export default PostCard
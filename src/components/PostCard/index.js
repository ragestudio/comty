import React from 'react'
import * as antd from 'antd'
import styles from './index.less'
import { MediaPlayer } from 'components'
import * as Icons from 'components/Icons'
import * as core from 'core'
import Icon from '@ant-design/icons'
import classnames from 'classnames'

import settings from 'core/libs/settings'
import { router } from 'core/libs'
import LikeBtn from './components/like'
import { connect } from 'umi'

const { Meta } = antd.Card

const defaultPayload = {
  id: null,
  post_time: null,
  postText: null,
  postFile: null,
  publisher: null,
  post_likes: null,
  is_post_pinned: null,
  is_liked: null,
  post_comments: null,
  get_post_comments: null,
  postPinned: false,
  postReported: false,
  postBoosted: false,
  ReportIgnore: false,
}

const contextMenuList = [
  {
    key: "inspect_element",
    title: "Copy URL",
    icon: <Icons.Clipboard />,
    params: {
      onClick: (e) => {
        core.writeToClipboard(core.generatePostURI(e.id))
      }
    }
  },
  {
    key: "screenshot",
    title: "Save screenshot",
    icon: <Icons.Aperture />,
    params: {
      itemProps: { 
        style: { color: "#40a9ff" }
      },
      onClick: (e) => {
        core.createScreenshotFromElement(document.getElementById(e.id))
      }
    }
  },
  {
    key: "require_test",
    title: "Require Test => DEV",
    icon: <Icons.Cloud />,
    params: {
      onClick: (e) => {
        console.log('Heeeey you developeeer')
      },
      keepOnClick: true,
      require: "dev"
    }
  }
 ]

@connect(({ app }) => ({ app }))
export default class PostCard extends React.Component {
  state = {
    visibleMoreMenu: false,
    payload: this.props.payload,
  }

  elementRef = React.createRef()
    
    handleDispatchInvoke(key, payload) {
        this.props.dispatch({
            type: "app/ipcInvoke",
            payload: { key: key, payload: payload } 
        })
    }

    goElementById(id){
      document.getElementById(id).scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center"
      })
    }

    toogleMoreMenu(){
      this.setState({ visibleMoreMenu: !this.state.visibleMoreMenu })
    }

    renderReportedPost(){
        if(this.state.ReportIgnore) return null
        return (
            <div className={styles.post_card_flaggedWarning}>
              <Icons.FlagOutlined />
              <h3>It seems that this post has been reported</h3>
              <p>The content may be inappropriate or compromising</p>
              <antd.Button
                onClick={() => {
                  this.setState({ ReportIgnore: true })
                }}
              >
                Ignore
              </antd.Button>
            </div>
        )
    } 

    renderPost(data){
        const {
            id,
            post_time,
            postText,
            postFile,
            publisher,
            post_likes,
            is_post_pinned,
            is_liked,
            post_comments,
            get_post_comments
          } = data || defaultPayload

        return(
            <>
            {this.state.postReported? this.renderReportedPost() : null}
            <div className={classnames(styles.post_include, {[styles.blur]: this.state.ReportIgnore? false : this.state.postReported })}>
              <Meta
                avatar={
                  <div className={styles.postAvatar}>
                    <antd.Avatar shape="square" size={50} src={publisher.avatar} />
                  </div>
                }
                title={
                  <div className={styles.post_card_title}>
                    <h4 onClick={() => router.go(`@${publisher.username}`)} className={styles.titleUser}>
                      @{publisher.username}
                      {core.booleanFix(publisher.verified)? (<Icon style={{ color: 'blue' }} component={Icons.verifiedBadge} />) : null}
                      {core.booleanFix(publisher.nsfw_flag)? (<antd.Tag style={{ margin: '0 0 0 13px' }} color="volcano" > NSFW </antd.Tag> ) : null}
                    </h4>
                    <div className={styles.PostTags}>
                      <div className={styles.MoreMenu}>
                        <antd.Dropdown onVisibleChange={this.handleVisibleChange} visible={this.state.visibleMoreMenu} trigger={['click']}>
                          <Icons.MoreOutlined key="actionMenu" />
                        </antd.Dropdown>
                      </div>
                      {core.booleanFix(is_post_pinned)? (<Icons.PushpinFilled />) : null}
                    </div>
                  </div>
                }
                description={<span className={styles.textAgo}>{post_time}</span>}
                bordered="false"
              />
              {postText ? (
                <div className={styles.post_card_content}>
                  <h3 dangerouslySetInnerHTML={{ __html: postText }} />
                </div>
              ) : null}
              {postFile ? (
                <div className={styles.post_card_file}>
                  <MediaPlayer file={postFile} />
                </div>
              ) : null}
              <div className={styles.ellipsisIcon}>
                <Icons.EllipsisOutlined />
              </div>
            </div>
            </>
        )
    }

    componentDidMount(){
      window.contextMenu.addEventListener(
        { 
          priority: 100, 
          onEventRender: contextMenuList, 
          ref: this.elementRef.current, 
          props: { id: this.state.payload.id }
        }
      )
    }

    render() {
      // 

        const actions = [
          <LikeBtn count={this.state.payload.post_likes} liked={core.booleanFix(this.state.payload.is_liked)} />,
          <Icons.Share2 />,
          <antd.Badge dot={this.state.payload.post_comments > 0 ? true : false}>
            <Icons.MessageSquare key="comments" />
          </antd.Badge>,
        ]

        return (
          <div ref={this.elementRef} key={this.state.payload.id} id={this.state.payload.id} className={styles.post_card_wrapper}>
            <antd.Card
              className={settings("post_hidebar") ? null : styles.showMode}
              onDoubleClick={() => null}
              onClick={() => this.goElementById(this.state.payload.id)}
              // onContextMenu={(e) => { 
              //   e.stopPropagation()
              //   e.preventDefault()
              //   window.contextMenu.open({ xPos: e.clientX, yPos: e.clientY, renderList: contextMenuList, id: this.state.payload.id  }) 
              // }}
              actions={actions}
              hoverable
            >
                {this.renderPost(this.state.payload)}
            </antd.Card>
          </div>
        )
    }
}
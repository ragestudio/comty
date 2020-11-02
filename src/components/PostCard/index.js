import React, { useLayoutEffect } from 'react'
import * as antd from 'antd'
import styles from './index.less'
import { MediaPlayer } from 'components'
import { Clipboard, Aperture, FlagOutlined, MessageSquare, MoreOutlined, PushpinFilled, EllipsisOutlined, verifiedBadge } from 'components/Icons'
import * as core from 'core'
import Icon from '@ant-design/icons'
import classnames from 'classnames'
import verbosity from 'core/libs/verbosity'

import settings from 'core/libs/settings'
import { router } from 'core/libs'
import LikeBtn from './components/like/index.js'
import { connect } from 'umi'
import { clipboard } from 'core/libs/browser'

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
    icon: <Clipboard />,
    params: {
      onClick: (e) => {
        clipboard.copyText(core.generatePostURI(e.id))
      }
    }
  },
  {
    key: "screenshot",
    title: "Save screenshot",
    icon: <Aperture />,
    params: {
      itemProps: {
        style: { color: "#40a9ff" }
      },
      onClick: (e) => {
        core.createScreenshotFromElement(document.getElementById(e.id))
      }
    }
  }
]

@connect(({ app }) => ({ app }))
export default class PostCard extends React.PureComponent {
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

  goElementById(id) {
    if (settings("post_autoposition")) {
      document.getElementById(id).scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center"
      })
    }
  }

  toogleMoreMenu() {
    this.setState({ visibleMoreMenu: !this.state.visibleMoreMenu })
  }

  renderReportedPost() {
    if (this.state.ReportIgnore) return null
    return (
      <div className={styles.post_card_flaggedWarning}>
        <FlagOutlined />
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

  renderContent(payload) {
    return (
      <div>
        {payload.postText ? (
          <div className={styles.post_card_content}>
            <h3 dangerouslySetInnerHTML={{ __html: payload.postText }} />
          </div>
        ) : null}
        {payload.postFile_full ? (
          <div className={styles.post_card_file}>
            <MediaPlayer file={payload.postFile_full} />
          </div>
        ) : null}
      </div>
    )
  }

  componentDidMount() {
    window.contextMenu.addEventListener(
      {
        priority: 100,
        onEventRender: contextMenuList,
        ref: this.elementRef.current,
        props: { id: this.state.payload.id }
      }
    )
  }

  handleLikeClick = (id, callback) => {
    if (typeof (this.props.handleActions)) {
      this.props.handleActions("like", id, (callbackResponse) => {
        let updated = this.state.payload
        if (callbackResponse.code == 200) {
          
          updated.is_liked = !this.state.payload.is_liked
          updated.post_likes = callbackResponse.response.count ?? 0
          this.setState({ payload: updated })

          if (typeof(callback) !== "undefined") {
            callback(callbackResponse.response.count)
          }

        } else {
          verbosity(`Api error response ${callbackResponse.code}`)
        }
      })
    } else {
      verbosity(`socket connection not available`)
    }
  }

  render() {
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
    } = this.state.payload || defaultPayload

    const actions = [
      <LikeBtn handleClick={(callback) => { this.handleLikeClick(id, (response) => { callback(response) }) }} count={post_likes} liked={core.booleanFix(is_liked)} />,
      <antd.Badge dot={this.state.payload.post_comments > 0 ? true : false}>
        <MessageSquare key="comments" />
      </antd.Badge>,
    ]

    return (
      <div ref={this.elementRef} key={this.state.payload.id} id={this.state.payload.id} className={styles.post_card_wrapper}>
        <antd.Card
          className={settings("post_hidebar") ? null : styles.showMode}
          onClick={() => { this.goElementById(this.state.payload.id) }}
          actions={actions}
          hoverable
        >
          {this.state.postReported ? this.renderReportedPost() : null}
          <div className={classnames(styles.post_include, { [styles.blur]: this.state.ReportIgnore ? false : this.state.postReported })}>
            <Meta
              avatar={
                <div className={styles.postAvatar}>
                  <antd.Avatar shape="square" size={50} src={publisher.avatar} />
                </div>
              }
              title={
                <div className={styles.post_card_title}>
                  <h4 onClick={() => router.goProfile(publisher.username)} className={styles.titleUser}>
                    @{publisher.username}
                    {core.booleanFix(publisher.verified) ? (<Icon style={{ color: 'blue' }} component={verifiedBadge} />) : null}
                    {core.booleanFix(publisher.nsfw_flag) ? (<antd.Tag style={{ margin: '0 0 0 13px' }} color="volcano" > NSFW </antd.Tag>) : null}
                  </h4>
                  <div className={styles.PostTags}>
                    <div className={styles.MoreMenu}>
                      <antd.Dropdown onVisibleChange={this.handleVisibleChange} visible={this.state.visibleMoreMenu} trigger={['click']}>
                        <MoreOutlined key="actionMenu" />
                      </antd.Dropdown>
                    </div>
                    {core.booleanFix(is_post_pinned) ? (<PushpinFilled />) : null}
                  </div>
                </div>
              }
              description={<span className={styles.textAgo}>{post_time}</span>}
              bordered="false"
            />
            {this.renderContent(this.state.payload)}
            <div className={styles.ellipsisIcon}>
              <EllipsisOutlined />
            </div>
          </div>
        </antd.Card>
      </div>
    )
  }
}
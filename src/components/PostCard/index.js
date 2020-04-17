import React from 'react'
import * as antd from 'antd'
import styles from './index.less'
import { CustomIcons, Like_button, MediaPlayer } from 'components'
import * as ycore from 'ycore'
import * as Icons from '@ant-design/icons'
import Icon from '@ant-design/icons'
import classnames from 'classnames'
import * as MICON from '@material-ui/icons'

const { Meta } = antd.Card

// Set default by configuration
const emptyPayload = {
  user: 'Post Empty',
  ago: 'This Post is empty',
  avatar: 'https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png',
  content: 'Empty',
}

class PostCard extends React.PureComponent {
  constructor(props) {
    super(props),
    this.state = {
      visibleMoreMenu: false,
      postPinned: this.props.payload.is_post_pinned,
      postSaved: this.props.payload.is_post_saved,
      postReported: this.props.payload.is_post_reported,
      postBoosted: this.props.payload.is_post_boosted,
      ReportIgnore: false,
    }
  }  
  handleVisibleChange = flag => {
    this.setState({ visibleMoreMenu: flag });
  };

  toogleMoreMenu(){
    this.setState({visibleMoreMenu: !this.state.visibleMoreMenu})
  }

  render() {
    const { payload, customActions } = this.props
    const ActShowMode = ycore.AppSettings.auto_hide_postbar

    const post_data = payload || emptyPayload;
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
    } = post_data

    const SwapThisPost = () => {
      localStorage.setItem('p_back_uid', id)
      if (postFile){
        ycore.SwapMode.openPost(id, post_data)
      }
      ycore.SwapMode.openComments(id)
    }

    const handlePostActions = {
      delete: post_id => {
        const payload = { post_id: post_id }
        ycore.comty_post.delete((err, res) => {
          if (err) {
            return false
          }
          ycore.FeedHandler.killByID(post_id)
        }, payload)
      },
      save: post_id => {
        const payload = { post_id: post_id }
        ycore.comty_post.save((err, res) => {
          if (err) {
            return false
          }
          if (this.state.postSaved == false) {
            ycore.notify.success('Post Saved')
            this.setState({ postSaved: true })
            return
          } else {
            ycore.notify.info('Removed from Saved')
            this.setState({ postSaved: false })
          }
        }, payload)
      },
      report: post_id => {
        ycore.app_modals.report_post(post_id)
      },
      boost: post_id => {
        const payload = { post_id: post_id }
        ycore.comty_post.__boost((err, res) => {
          if (err) {
            return false
          }
          if (this.state.postBoosted == false) {
            ycore.notify.success('Post Boosted')
            this.setState({ postBoosted: true })
            return
          } else {
            ycore.notify.info('Post Unboosted')
            this.setState({ postBoosted: false })
          }
        }, payload)
      },
    }
    const defaultActions = [
      <div>
        <Like_button
          count={post_likes}
          id={id}
          liked={ycore.booleanFix(is_liked) ? true : false}
          key="like"
        />
      </div>,
      <antd.Badge dot={post_comments > 0 ? true : false}>
        <MICON.InsertComment key="comments" onClick={() => SwapThisPost()} />
      </antd.Badge>,
    ]
    const actions = customActions || defaultActions

    const MoreMenu = (
      <antd.Menu >
        {ycore.IsThisPost.owner(publisher.id) ? (
          <antd.Menu.Item
            key="remove_post"
          > 
            <antd.Popconfirm
              title="Are you sure delete this post?"
              onConfirm={() => handlePostActions.delete(id) & this.toogleMoreMenu()}
              okText="Yes"
              cancelText="No"
            >
              <Icons.DeleteOutlined /> Remove post
            </antd.Popconfirm>
            
          </antd.Menu.Item>
        ) : null}
        {ycore.IsThisPost.owner(publisher.id) ? (
          ycore.IsThisUser.pro(publisher.id) ? (
            <antd.Menu.Item
              onClick={() => handlePostActions.boost(id) & this.toogleMoreMenu()}
              key="boost_post"
            >
              <Icons.RocketOutlined />
              {this.state.postBoosted ? 'Unboost' : 'Boost'}
            </antd.Menu.Item>
          ) : null
        ) : null}
        {ycore.IsThisPost.owner(publisher.id) ? <hr /> : null}
        <antd.Menu.Item
          onClick={() => handlePostActions.save(id) & this.toogleMoreMenu()}
          key="save_post"
        >
          <Icons.SaveOutlined />
          {this.state.postSaved ? 'Unsave post' : 'Save Post'}
        </antd.Menu.Item>
        {this.state.postReported? null: 
        <antd.Menu.Item
          onClick={() => handlePostActions.report(id) & this.toogleMoreMenu() }
          key="report_post"
        >
          <Icons.FlagOutlined /> Report post
        </antd.Menu.Item>
        }
      </antd.Menu>
    )

    return (
      <div className={styles.post_card_wrapper}>
        <antd.Card
          onDoubleClick={() => SwapThisPost()}
          hoverable
          className={ActShowMode ? null : styles.showMode}
          actions={actions}
        >
          {this.state.ReportIgnore ? null : this.state.postReported ? (
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
          ) : null}
          <div
            className={classnames(styles.post_include, {
              [styles.blur]: this.state.ReportIgnore
                ? false
                : this.state.postReported,
            })}
          >
            <Meta
              avatar={
                <div className={styles.postAvatar}>
                  <antd.Avatar
                    shape="square"
                    size={50}
                    src={publisher.avatar}
                  />
                </div>
              }
              title={
                <div className={styles.post_card_title}>
                  <h4
                    onClick={() =>
                      ycore.router.go(`@${publisher.username}`)
                    }
                    className={styles.titleUser}
                  >
                    @{publisher.username}
                    {ycore.booleanFix(publisher.verified) ? (
                      <Icon
                        style={{ color: 'blue' }}
                        component={CustomIcons.VerifiedBadge}
                      />
                    ) : null}
                    {ycore.booleanFix(publisher.nsfw_flag) ? (
                      <antd.Tag
                        style={{ margin: '0 0 0 13px' }}
                        color="volcano"
                      >
                        NSFW
                      </antd.Tag>
                    ) : null}
                  </h4>
                  <div className={styles.PostTags}>
                    <div className={styles.MoreMenu}>
                      <antd.Dropdown onVisibleChange={this.handleVisibleChange} visible={this.state.visibleMoreMenu} overlay={MoreMenu} trigger={['click']}>
                        <Icons.MoreOutlined key="actionMenu" />
                      </antd.Dropdown>
                    </div>
                    {ycore.booleanFix(is_post_pinned) ? (
                      <Icons.PushpinFilled />
                    ) : null}
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
        </antd.Card>
      </div>
    )
  }
}
export default PostCard

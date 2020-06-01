import React from 'react'
import * as antd from 'antd'
import styles from './index.less'
import { Like_button, MediaPlayer } from 'components'
import * as Icons from 'components/Icons'
import * as app from 'app'
import Icon from '@ant-design/icons'
import classnames from 'classnames'
import * as MICON from '@material-ui/icons'

const { Meta } = antd.Card

// Set default by configuration
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

class PostCard extends React.PureComponent {
  constructor(props) {
    super(props),
    this.state = {
      visibleMoreMenu: false,
      payload: this.props.payload,
    }
  }  

  componentDidMount(){
    const a = this.props.payload
    const b = defaultPayload
    try {
      if(a){
        let tmp;
        const propsArray = Object.keys(a)
        const defaultArray = Object.keys(b)
        propsArray.forEach(e => {
          if (defaultArray.includes(e)){
            tmp[e] = "something"
          }
          
        })
        console.log(tmp)
      }
    
      else{
        console.warn('Empty payload, setting default...')
        this.setState({ payload: b})
      }
    } catch (error) {
      
    }
  }

  handleVisibleChange = flag => {
    this.setState({ visibleMoreMenu: flag });
  };

  toogleMoreMenu(){
    this.setState({visibleMoreMenu: !this.state.visibleMoreMenu})
  }

  render() {
    const { payload } = this.state
    const ActShowMode = app.AppSettings.auto_hide_postbar

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
    } = payload || defaultPayload

    if(!id, !postText, !postFile, !publisher) return null


    const SwapThisPost = () => {
      localStorage.setItem('p_back_uid', id)
      
      app.SwapMode.openPost(id, payload)
      app.SwapMode.openComments(id)

    }

    const handlePostActions = {
      delete: post_id => {
        const payload = { post_id: post_id }
        app.comty_post.delete((err, res) => {
          if (err) {
            return false
          }
          app.RenderFeed.killByID(post_id)
        }, payload)
      },
      save: post_id => {
        const payload = { post_id: post_id }
        app.comty_post.save((err, res) => {
          if (err) {
            return false
          }
          if (this.state.postSaved == false) {
            app.notify.success('Post Saved')
            this.setState({ postSaved: true })
            return
          } else {
            app.notify.info('Removed from Saved')
            this.setState({ postSaved: false })
          }
        }, payload)
      },
      report: post_id => {
        app.app_modals.report_post(post_id)
      },
      boost: post_id => {
        const payload = { post_id: post_id }
        app.comty_post.__boost((err, res) => {
          if (err) {
            return false
          }
          if (this.state.postBoosted == false) {
            app.notify.success('Post Boosted')
            this.setState({ postBoosted: true })
            return
          } else {
            app.notify.info('Post Unboosted')
            this.setState({ postBoosted: false })
          }
        }, payload)
      },
    }
    const actions = [
      <Like_button key="like" count={post_likes} id={id} liked={app.booleanFix(is_liked) ? true : false} />,
      <Icons.Share2 />,
      <antd.Badge dot={post_comments > 0 ? true : false}>
        <Icons.MessageSquare key="comments" onClick={() => SwapThisPost()} />
      </antd.Badge>,
    ]

    const MoreMenu = (
      <antd.Menu >
        {app.IsThisPost.owner(publisher.id) ? (
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
        {app.IsThisPost.owner(publisher.id) ? (
          app.IsThisUser.pro(publisher.id) ? (
            <antd.Menu.Item
              onClick={() => handlePostActions.boost(id) & this.toogleMoreMenu()}
              key="boost_post"
            >
              <Icons.RocketOutlined />
              {this.state.postBoosted ? 'Unboost' : 'Boost'}
            </antd.Menu.Item>
          ) : null
        ) : null}
        {app.IsThisPost.owner(publisher.id) ? <hr /> : null}
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
                      app.router.go(`@${publisher.username}`)
                    }
                    className={styles.titleUser}
                  >
                    @{publisher.username}
                    {app.booleanFix(publisher.verified) ? (
                      <Icon
                        style={{ color: 'blue' }}
                        component={Icons.VerifiedBadge}
                      />
                    ) : null}
                    {app.booleanFix(publisher.nsfw_flag) ? (
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
                    {app.booleanFix(is_post_pinned) ? (
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

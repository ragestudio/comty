import React from 'react'
import styles from './renders.less'
import { SearchCard } from 'components'

import * as antd from 'antd'
import * as ycore from 'ycore'
import * as Icons from '@ant-design/icons'
import Icon from '@ant-design/icons'

import { MediaPlayer, PostCard } from 'components'

const VerifiedBadge = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="#55acee"
    width="15"
    height="15"
    viewBox="0 0 24 24"
  >
    <path d="M23 12l-2.44-2.78.34-3.68-3.61-.82-1.89-3.18L12 3 8.6 1.54 6.71 4.72l-3.61.81.34 3.68L1 12l2.44 2.78-.34 3.69 3.61.82 1.89 3.18L12 21l3.4 1.46 1.89-3.18 3.61-.82-.34-3.68L23 12m-13 5l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"></path>
  </svg>
)

export class __priPost extends React.PureComponent {
  renderContent(payload) {
    const { id, postText, postFile_full, post_time, publisher } = payload
    const {isMobile}= this.props

    return (
      <div className={styles.contentWrapper}>
        {postFile_full ? <MediaPlayer isMobile={isMobile} entire={true} file={postFile_full} /> : null}
      </div>
    )
  }

  render() {
    const {payload} = this.props
    if (!payload) {
      return <h1>This post not exists!!!</h1>
    }
    const { id, postText, postFile_full, post_time, publisher } = payload
    return (
      <div className={styles.SecondaryBody}>
        <div className={styles.UserContainer}>
          <div className={styles.UserContainer_text}>
            <h4 className={styles.titleUser}>
              {publisher.username}{' '}
              {ycore.booleanFix(publisher.verified) ? (
                <Icon style={{ color: 'blue' }} component={VerifiedBadge} />
              ) : null}
            </h4>
            <p>
              {' '}
              {post_time} {ycore.IsThisUser.dev() ? `| #${id}` : null}{' '}
            </p>
          </div>
          <antd.Avatar shape="square" size={50} src={publisher.avatar} />
        </div>
        {this.renderContent(payload)}
      </div>
    )
  }
}

export class __secComments extends React.Component {
  state = {
    comment_data: this.props.payload,
    raw_comment: '',
    loading: false,
  }
  handleDeleteComment(id) {
    ycore.yconsole.log(`Removing Comment with id => ${id}`)
    ycore.comty_post_comment.delete(
      (err, res) => {
        if (err) {
          return false
        }
        return this.reloadComments()
      },
      { comment_id: id }
    )
  }
  handleNewComment() {
    const { raw_comment } = this.state
    const { post_id } = this.props
    if (raw_comment) {
      const payload = { post_id: post_id, raw_text: raw_comment }
      ycore.comty_post_comment.new((err, res) => {
        if (err) {
          ycore.notify.error('This action could not be performed.', err)
        }
        this.setState({ raw_comment: '' })
        return this.reloadComments()
      }, payload)
    }
    return false
  }

  renderComment = a => {
    const { id, time, Orginaltext, publisher } = a
    const CommentMenu = (
      <antd.Menu>
        <antd.Menu.Item
          key="remove_comment"
          onClick={() => this.handleDeleteComment(id)}
        >
          <Icons.DeleteOutlined /> Delete
        </antd.Menu.Item>
      </antd.Menu>
    )
    return (
      <div className={styles.comment_card}>
        <div className={styles.comment_title}>
          <img src={publisher.avatar} />
          <p className={styles.comment_user_username}>
            @{publisher.username}{' '}
            {ycore.booleanFix(publisher.verified) ? (
              <Icon style={{ color: 'black' }} component={VerifiedBadge} />
            ) : null}
          </p>
          <antd.Dropdown
            disabled={ycore.IsThisPost.owner(publisher.id) ? false : true}
            overlay={CommentMenu}
            trigger={['click']}
          >
            <p
              onClick={e => e.preventDefault()}
              className={styles.comment_user_ago}
            >
              {ycore.time.stmToAgo(time)}
            </p>
          </antd.Dropdown>
        </div>
        <div className={styles.comment_text}>
          <p>{Orginaltext}</p>
        </div>
      </div>
    )
  }
  HandleCommentInput = e => {
    const { value } = e.target
    this.setState({ raw_comment: value })
  }
  reloadComments() {
    try {
      this.setState({ loading: true })
      const payload = { post_id: this.props.post_id }
      ycore.comty_post.get((err, res) => {
        const post_comments = JSON.parse(res)['post_comments']
        this.setState({ comment_data: post_comments, loading: false })
      }, payload)
    } catch (error) {
      return false
    }
  }

  render() {
    const { comment_data, loading } = this.state

    return (
      <div className={styles.comments_body}>
        <div className={styles.comments_body_title}>
           <h1>Comments ({comment_data.length})</h1>
        </div>
        <div className={styles.comments_cards_wrapper}>
          {loading ? (
            <antd.Skeleton active />
          ) : (
            <antd.List
              itemLayout="horizontal"
              dataSource={comment_data}
              renderItem={item => this.renderComment(item)}
            />
          )}
        </div>
        <div className={styles.comment_box}>
          <div className={styles.comment_box_body}>
            <antd.Input
              value={this.state.raw_comment}
              onPressEnter={() => this.handleNewComment()}
              placeholder="Write a comment..."
              allowClear
              onChange={this.HandleCommentInput}
            />
          </div>
        </div>
      </div>
    )
  }
}

export class __priSearch extends React.PureComponent {
  renderResult = source => {
    try {
      const Empty = (
        <div>
          <antd.Result
            status="404"
            title="Nothing..."
            subTitle="Sorry, this does not exist."
          />
        </div>
      )

      // TO DO:  Settings serach & Post Search
      const usersParsed = JSON.parse(source)['users']
      const groupsParsed = JSON.parse(source)['groups']
      const pagesParsed = JSON.parse(source)['pages']

      const users = () => {
        if (usersParsed.length >= 1) {
          ycore.yconsole.log('Users => ', usersParsed)
          return this.EntryComponent('Users', usersParsed)
        }
      }
      const groups = () => {
        if (groupsParsed.length >= 1) {
          ycore.yconsole.log('Groups => ', groupsParsed)
          return this.EntryComponent('Groups', groupsParsed)
        }
      }
      const pages = () => {
        if (pagesParsed.length >= 1) {
          ycore.yconsole.log('Pages => ', pagesParsed)
          return this.EntryComponent('Pages', pagesParsed)
        }
      }

      if (
        !usersParsed.length >= 1 &&
        !groupsParsed.length >= 1 &&
        !pagesParsed.length >= 1
      ) {
        return Empty
      }

      return [users(), groups(), pages()]
    } catch (error) {
      return (
        <center>
          <h2>Render Error</h2>
        </center>
      )
    }
  }
  EntryComponent = (t, source) => {
    try {
      return (
            <antd.List
              dataSource={source}
              renderItem={item => 
                <div id={item.id} className={styles.search_card} onClick={() => {ycore.router.go(`@${item.username}`)}}>
                  <div className={styles.search_title}>
                    <img src={item.avatar} />
                    <p className={styles.search_user_username}>
                      @{item.username}
                      {ycore.booleanFix(item.verified) ? (
                        <Icon component={VerifiedBadge} />
                      ) : null}
                    </p>
                   
                  </div>
                  <div className={styles.search_text}>
                    <p>{item.about}</p>
                  </div>
                </div>
              }
            />

      )
    } catch (error) {
      return (
        <center>
          <h2>Render Error</h2>
        </center>
      )
    }
  }
  render(){
    return(      
      <div className={styles.search_wrapper}>
          {this.renderResult(this.props.payload)}
      </div>
    )
  }
}

export class __trendings extends React.PureComponent {
  render(){
    if (!this.props.data) return false
    return(
      <div className={styles.secondary_hastags}>
        <div className={styles.secondary_hastags_title}> <h2>Trending now</h2> </div>
        <div className={styles.secondary_hastags_body}>
          <antd.List
            dataSource={this.props.data}
            renderItem={item=>(
            <div className={styles.hash}>
              <p>#{item.tag}</p>
              <p style={{ color: "white", fontSize: "9px" }}> {item.trend_use_num} Posts</p>
            </div>)}
          />
        </div>
      </div>
    )
  }
}

export class __pro extends React.PureComponent {
  render(){
    return(
      <div className={styles.secondary_adv_pro}>
        <h1>
          Go Pro!
        </h1>
        <p>Sabias que la frase de kintxi, se hace la que no me conoze se hizo mientras estaba borracho</p>
        <antd.Button>Start now <Icons.RightOutlined /></antd.Button>
      </div>
    )
  }
}

const _info = ycore.AppInfo

export const __footer = () =>{
  return <div className={styles.__footer}>
    v{ycore.AppInfo.version}  |  About  |  Legal  |  Help
  </div>
}
import React from 'react'
import { List } from 'antd'
import { connect } from 'umi'
import settings from 'core/libs/settings'
import verbosity from 'core/libs/verbosity'
import { PostCard, PostCreator, Invalid } from 'components'
import * as antd from 'antd'
import styles from './index.less'

@connect(({ app, socket }) => ({ app, socket }))
export default class PostsFeed extends React.Component {
  state = {
    socket: null,
    feed: null,
    renderError: false
  }

  addPostToRender(payload) {
    let postSchema = {
      id: this.state.feed[0].id + 1,
      post_time: "who knows",
      postText: "empty",
      publisher: "me",
      post_likes: 2500
    }

    if (typeof(payload) !== "undefined") {
      postSchema = { ...postSchema, ...payload }
    }

    let updated = this.state.feed
    updated.push(postSchema)
    this.setState({ feed: updated })
    this.goPostById(postSchema.id)
  }

  goPostById(id) {
    document.getElementById(id).scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "center"
    })
  }

  getUserIdByProps(id) {
      if(typeof(id) == "string") {
        return new Number(id)
      }
      return id
  }

  fetchFeed() {
    const { socket } = this.state
    if (socket) {
      const requestPayload = {
        from: this.props.from ?? "feed",
        userToken: this.props.app.session_token,
        id: this.getUserIdByProps(this.props.fromID) ?? this.props.app.session_uuid
      }

      const requestCallback = (data) => {
        if (Array.isArray(data.response)) {
          this.setState({ feed: data.response })
        } else {
          verbosity([`error gathering posts >`, data])
          this.setState({ renderError: true })
        }
      }

      socket._emit("get", requestPayload, requestCallback)
    }
  }

  handlePostActions(action, post_id, callback) {
    const { socket } = this.state
    if (socket) {
      const requestPayload = {
        userToken: this.props.app.session_token,
        post_id,
        action
      }

      socket._emit("actions", requestPayload, (res) => callback(res))
    }
  }

  componentDidMount() {
    window.addPostToRender = (...context) => this.addPostToRender(...context)

    if (this.props.app.session_valid) {
      this.props.dispatch({
        type: "socket/use",
        persistent: true,
        scope: "posts",
        then: (data) => {
          this.setState({ socket: data })
          this.fetchFeed()
        }
      })
    }

  }

  componentWillUnmount() {
    if (this.state.socket) {
      this.state.socket.remove()
    }
  }

  render() {
    if (!this.props.app.session_valid) {
      return <Invalid type="SESSION_INVALID" />
    }

    if (!this.state.feed) {
      return (
        <antd.Card bordered="false" >
          <antd.Skeleton active />
        </antd.Card>
      )
    }

    if (this.state.renderError) {
      return (
        <Invalid type="SESSION_INVALID" />
      )
    }

    return (
      <div className={styles.exploreWrapper}>
        <List
          //loadMore={loadMore}
          dataSource={this.state.feed}
          renderItem={item => (
            <PostCard handleActions={(...context) => this.handlePostActions(...context)} payload={item} />
          )}
        />
      </div>
    )
  }
}

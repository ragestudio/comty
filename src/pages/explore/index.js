import React from 'react'
import { List } from 'antd'
import endpoints from 'config/endpoints'
import { v3_model } from 'core/libs'
import { connect } from 'umi'
import settings from 'core/libs/settings'
import verbosity from 'core/libs/verbosity'
import { PostCard, PostCreator, Invalid } from 'components'
import * as antd from 'antd'
import styles from './index.less'

@connect(({ app, socket }) => ({ app, socket }))
export default class Explore extends React.Component {

  state = {
    feed: null,
    renderError: false
  }

  request(){
    this.props.dispatch({
      type: "socket/use",
      scope: "posts",
      invoke: "get",
      query: {
        payload: {
          from: "feed",
          userToken: this.props.app.session_token
        },
        callback: (data) => {
          if (Array.isArray(data.response)) {
            this.setState({ feed: data.response })
          }else{
            verbosity([`error gathering posts >`, data])
            this.setState({ renderError: true })
          }
        }
      }
    })
  }

  componentDidMount(){
    if(this.props.app.session_valid){
      this.request()
    }
  }

  render() {
    if(!this.props.app.session_valid){
      return <Invalid type="SESSION_INVALID" />
    }

    if (!this.state.feed){
        return (
            <antd.Card bordered="false" >
              <antd.Skeleton active />
            </antd.Card>
        )
    }

    if (this.state.renderError){
      return (
        <Invalid type="SESSION_INVALID" />
      )
    }

    return(
      <div className={styles.exploreWrapper}>
        <List
            //loadMore={loadMore}
            dataSource={this.state.feed}
            renderItem={item => (
              <PostCard payload={item}/>
            )}
        />
      </div> 
    )
  }
}

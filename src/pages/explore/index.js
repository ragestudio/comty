import React from 'react'
import { List } from 'antd'
import endpoints from 'config/endpoints'
import { v3_model } from 'core/libs'
import { connect } from 'umi'
import settings from 'core/libs/settings'
import { PostCard, PostCreator, Invalid } from 'components'
import * as antd from 'antd'
import styles from './index.less'

@connect(({ app }) => ({ app }))
export default class Explore extends React.Component {

  state = {
    feed: null
  }

  request(){
    v3_model.api_request(
      {
        body: {limit: settings("post_catchlimit"), type: "get_news_feed"},
        serverKey: this.props.app.server_key,
        userToken: this.props.app.session_token,
        endpoint: endpoints.posts,
        verbose: true,
      },
      (err, res) => {
        try {
            this.setState({ feed: JSON.parse(res)['data'] })
        } catch (error) {
          // terrible (⓿_⓿)
        }
      }
    )
  }

  componentDidMount(){
    if (this.props.app.session_valid) {
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

import React from 'react'
import { List } from 'antd'
import endpoints from 'config/endpoints'
import { v3_model } from 'core/libs'
import { connect } from 'umi'
import settings from 'core/libs/settings'
import { PostCard, PostCreator } from 'components'
import * as antd from 'antd'

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
      return (<antd.Result status="403" title="You need to login for view this!" />)
    }

    if (!this.state.feed){
        return (
            <antd.Card bordered="false" >
              <antd.Skeleton active />
            </antd.Card>
        )
    }

    return(
      <div>
        <List
            //loadMore={loadMore}
            dataSource={this.state.feed}
            renderItem={item => (
                <div id={item.id}>
                    <PostCard payload={item} key={item.id} />
                </div>
            )}
        />
      </div> 
    )
  }
}

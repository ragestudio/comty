import React from 'react'
import * as antd from 'antd'
import * as ycore from 'ycore'

import InfiniteScroll from 'react-infinite-scroller';

import {PostCard} from 'components'

var userData = ycore.SDCP()

export function RefreshFeed(){
    ycore.yconsole.log('Refreshing Feed...')
    window.MainFeedComponent.handleRefreshList();
    return
}
class MainFeed extends React.Component {
    constructor(props){
        super(props)
        window.MainFeedComponent = this;
        this.state = {
            feedRaw: [],
            loading: true,
            hasMore: true,
        }
    }

    toogleLoader(){
        this.setState({ loading: !this.state.loading })
    }
    
    GetPostsData(fkey){
        const { get, uid, filters } = this.props;
        if (!get) {
            ycore.yconsole.error('Please, fill params with an catch type...')
            return
        }
        if (!fkey) {
            ycore.yconsole.warn('Please, provide a fkey for offset the feed, default using => 0');
            
        }
        this.toogleLoader()
        ycore.GetPosts(uid, get, (fkey || '0'), (err, result) => {
            this.setState({ feedRaw: result, loading: false })
        })
    }

    componentDidMount(){
        this.GetPostsData()
        
    }

    renderFeedPosts = (e) =>{
        const {feedRaw} = this.state
        const { get, filters } = this.props
        try {
            const feedParsed = JSON.parse(feedRaw)['data']
            ycore.yconsole.log(feedParsed)
            return (
                feedParsed.map(item=> {
                    const {id, postText, post_time, publisher, postFile, postFileName, is_liked, is_post_saved, is_post_reported, is_post_boosted, is_post_pinned, post_likes} = item
                    const paylodd = {
                      id: id,
                      user: publisher.username, 
                      ago: post_time, 
                      avatar: publisher.avatar, 
                      content: postText, 
                      file: postFile, 
                      postFileName: postFileName, 
                      publisher: publisher,
                      post_likes: post_likes,
                      is_liked: is_liked,  
                      is_post_saved: is_post_saved,
                      is_post_reported: is_post_reported,
                      is_post_boosted: is_post_boosted,
                      is_post_pinned: is_post_pinned,
                    }
                    return <PostCard payload={paylodd} key={id} />
                })
            )
        } catch (err) {
            ycore.notifyError(err)
            const paylodd = {user: '', ago: '', avatar: '', content: '',  publisher: '' }
            return <PostCard payload={paylodd} />
        }
    }

    handleInfiniteOnLoad = () => {
      const { get, uid, filters } = this.props;
      let { feedRaw } = this.state;
      this.setState({
        loading: true,
      });
      if (feedRaw.length > 300) {
        antd.message.warning('Infinite List loaded all');
        this.setState({
          hasMore: false,
          loading: false,
        });
        return;
      }
      console.log('LENGTHT', feedRaw.length)
      ycore.GetPostsData(uid, get, feedRaw.length, (err, res) => {
        feedRaw = feedRaw.concat(res.results);
        this.setState({
          feedRaw,
          loading: false,
        });
      });
    };
    
 

    render(){
        const { loading, feedRaw } = this.state;   
        const loaderCard = ( <antd.Card style={{  maxWidth: '26.5vw', margin: 'auto' }} >
        <antd.Skeleton avatar paragraph={{ rows: 4 }} active />
    </antd.Card>)
    
        return (
            <div>      
                <InfiniteScroll
          initialLoad={false}
          pageStart={0}
          loadMore={this.handleInfiniteOnLoad}
          hasMore={!this.state.loading && this.state.hasMore}
          useWindow={false}
        >
          <List
            dataSource={this.state.feedRaw}
            renderItem={item => (
              <List.Item key={item.id}>
                <List.Item.Meta
                  avatar={
                    <Avatar src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png" />
                  }
                  title={<a href="https://ant.design">{item.name.last}</a>}
                  description={item.email}
                />
                <div>Content</div>
              </List.Item>
            )}
          >
            {this.state.loading && this.state.hasMore && (loaderCard)}
          </List>
        </InfiniteScroll>
              
            </div>
        )
    }
}
export default MainFeed;
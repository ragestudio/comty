import React from 'react'
import * as antd from 'antd'
import * as ycore from 'ycore'
import {PostCard} from 'components'


var userData = ycore.SDCP()


class Main extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            feedRaw: '',
        }
    }
    fetchFeed() {
        var formdata = new FormData();
        formdata.append("server_key", ycore.yConfig.server_key);
        formdata.append("type", "get_news_feed");

        var requestOptions = {
          method: 'POST',
          body: formdata,
          redirect: 'follow'
        };
        const objUrl = `${ycore.endpoints.get_userPostFeed}${ycore.GetUserToken.decrypted().UserToken}`
        console.log(objUrl)
        fetch(objUrl, requestOptions)
          .then(response => response.text())
          .then(result => {
              console.log(result)
              this.setState({ feedRaw: result })
          })
          .catch(error => console.log('error', error));
    }
    componentDidMount(){
        this.fetchFeed()
    }
    
    renderFeedPosts(){
        const {feedRaw} = this.state
        try {
            const feedParsed = JSON.parse(feedRaw)['data']
            return (
                feedParsed.map(item=> {
                    const {postText, post_time, publisher, postFile, postFileName} = item
                    const paylodd = {user: publisher.username, ago: post_time, avatar: publisher.avatar, content: postText, file: postFile, postFileName: postFileName }
                    console.log([item], paylodd)
                    return <PostCard payload={paylodd} />
                })
            )
        } catch (err) {
            console.error(`Error detected when proccessing the feed posts... =>  ${err}`)
        }
    
    }
    render(){
        return (
            <div>   
              { this.renderFeedPosts() }
            </div>
        )
    }
}
export default Main;
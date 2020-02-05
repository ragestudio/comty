import React from 'react'
import * as antd from 'antd'
import * as ycore from 'ycore'
import {PostCard, PostCreator, MainSidebar} from 'components'
import styles from './index.less'

var userData = ycore.SDCP()

class Main extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            feedRaw: '',
            loading: true,
        }
    }
    GetFeedPosts() {
        let global;
        let formdata = new FormData();
        formdata.append("server_key", ycore.yConfig.server_key);
        formdata.append("type", "get_news_feed");
    
        const requestOptions = {
          method: 'POST',
          body: formdata,
          redirect: 'follow'
        };
        const objUrl = `${ycore.endpoints.get_userPostFeed}${ycore.GetUserToken.decrypted().UserToken}`
        console.log(objUrl)
        fetch(objUrl, requestOptions)
          .then(response => response.text())
          .then(result => {
            this.setState({ feedRaw: result, loading: false })
          })
          .catch(error => console.log('error', error));
    
    }
    componentDidMount(){
        this.GetFeedPosts()
    }
    
    renderFeedPosts(){
        const {feedRaw} = this.state
        try {
            const feedParsed = JSON.parse(feedRaw)['data']
            return (
                feedParsed.map(item=> {
                    const {postText, post_time, publisher, postFile, postFileName} = item
                    const paylodd = {user: publisher.username, ago: post_time, avatar: publisher.avatar, content: postText, file: postFile, postFileName: postFileName, publisher: publisher }
                    console.log([item], paylodd)
                    return <PostCard payload={paylodd} />
                })
            )
        } catch (err) {
            ycore.notifyError(err)
            const paylodd = {user: 'Error', ago: '', avatar: '', content: 'Woops an error spawns here :/, maybe reloading?',  publisher: '' }
            return <PostCard payload={paylodd} />
        }
    
    }
    render(){
        const { loading } = this.state;
        return (
            <div> 
                <MainSidebar />
                <PostCreator />
                {loading? <antd.Card style={{  maxWidth: '26.5vw', margin: 'auto' }} ><antd.Skeleton avatar paragraph={{ rows: 4 }} active /></antd.Card> : <div className={styles.PostsWrapper}> {this.renderFeedPosts()} </div>}
            </div>
        )
    }
}
export default Main;
import React from 'react'
import * as antd from 'antd'
import * as ycore from 'ycore'
import {PostCard} from 'components'

var userData = ycore.SDCP()

export function RefreshFeed(){
    ycore.DevOptions.ShowFunctionsLogs? console.log('Refreshing Feed...') : null
    window.MainFeedComponent.handleRefreshList();
    return
}
class MainFeed extends React.Component {
    constructor(props){
        super(props)
        window.MainFeedComponent = this;
        this.state = {
            loading: true,
        }
    }
    toogleLoader(){
        this.setState({ loading: !this.state.loading })
    }
    componentDidMount(){
        const { get, uid, filters } = this.props
        if (!get) {
            console.error('Please, fill params with an catch type...')
            return
        }
        ycore.GetPosts(uid, get, (err, result) => this.setState({ feedRaw: result, loading: false }))
    }
    handleRefreshList(){
        const { get, uid, filters } = this.props
        if (!get) {
            console.error('Please, fill params with an catch type...')
            return
        }
        this.toogleLoader()
        ycore.GetPosts(uid, get, (err, result) => this.setState({ feedRaw: result, loading: false }))
    }
    renderFeedPosts(e){
        const {feedRaw} = this.state
        const { get, filters } = this.props
        try {
            const feedParsed = JSON.parse(feedRaw)['data']
            ycore.DevOptions.ShowFunctionsLogs? console.log(feedParsed) : null
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
    render(){
        const { loading } = this.state;   
        return (
            <div>   
                {loading? 
                    <antd.Card style={{  maxWidth: '26.5vw', margin: 'auto' }} >
                        <antd.Skeleton avatar paragraph={{ rows: 4 }} active />
                    </antd.Card> :
                    this.renderFeedPosts()
                }
            </div>
        )
    }
}
export default MainFeed;
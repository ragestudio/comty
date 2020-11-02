import React from 'react'
import { connect } from 'umi'
import { PostsFeed } from 'components'

@connect(({ app }) => ({ app }))
export default class Post extends React.Component{
    state = {
        postID: null
    }
    componentDidMount(){
        this.setState({ postID: new URLSearchParams(location.search).get('key') })
    }
    render(){
        if (!this.state.postID) {
            return null
        }
        return <PostsFeed from="post" fromID={this.state.postID} />
    }
}
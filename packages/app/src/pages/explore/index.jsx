import React from "react"
import * as antd from "antd"
import { PostCard, PostCreator } from "components"
import { InfiniteScroll } from "antd-mobile"

import "./index.less"

export default class PostsExplorer extends React.Component {
    state = {
        loading: true,
        skipStep: 0,
        lastLength: 0,
        posts: [],
    }

    api = window.app.request

    componentDidMount = async () => {
        this.toogleLoading(true)

        await this.fetchPosts()

        window.app.ws.listen(`new.post`, (data) => {
            this.addPost(data)
        })

        this.toogleLoading(false)
    }

    toogleLoading = (to) => {
        this.setState({ loading: to ?? !this.state.loading })
    }

    addPost = (post) => {
        this.setState({
            posts: [post, ...this.state.posts],
        })
    }

    fetchPosts = async () => {
        const posts = await this.api.get.feed(undefined, {
            feedSkip: this.state.skipStep,
        }).catch(error => {
            console.error(error)
            antd.message.error(error)

            return false
        })

        if (posts) {
            console.log(posts)
            this.setState({ posts: [...posts, ...this.state.posts,], lastLength: posts.length })
        }
    }

    hasMore = () => {
        return this.state.posts.length < this.state.lastLength
    }

    loadMore = async () => {
        await this.setState({ skipStep: this.state.skipStep + 1 })
        await this.fetchPosts()
    }

    render() {
        if (this.state.loading) {
            return <antd.Skeleton active />
        }

        return <div className="explore">
            <div className="wrapper">
                <div className="header">
                    <PostCreator />
                </div>

                {
                    this.state.posts.map(post => {
                        return <PostCard data={post} />
                    })
                }

                <InfiniteScroll loadMore={this.loadMore} hasMore={this.hasMore} >
                    <div>Loading more...</div>
                </InfiniteScroll>
            </div>
        </div>
    }
}
import React from "react"
import * as antd from "antd"
import { PostCard } from "components"

import "./index.less"

export default class PostsExplorer extends React.Component {
    state = {
        loading: true,
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
        const posts = await this.api.get.feed().catch(error => {
            console.error(error)
            antd.message.error(error)

            return false
        })

        if (posts) {
            console.log(posts)
            this.setState({ posts })
        }

    }

    renderPosts = (posts) => {
        if (!Array.isArray(posts)) {
            antd.message.error("Failed to render posts")
            return null
        }

        return posts.map((post) => {
            return <PostCard data={post} />
        })
    }

    render() {
        return <div className="explore">
            {this.state.loading ? <antd.Skeleton active /> : this.renderPosts(this.state.posts)}
        </div>
    }
}
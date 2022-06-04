import React from "react"
import * as antd from "antd"
import { User } from "models"
import { PostCard } from "components"

import "./index.less"

export default class PostsFeed extends React.Component {
    state = {
        selfId: null,
        initialLoading: true,
        renderList: [],
    }

    api = window.app.request

    listRef = React.createRef()

    wsEvents = {
        "post.new": async (data) => {
            this.insert(data)
        },
        "post.delete": async (data) => {
            this.remove(data)
        }
    }

    componentDidMount = async () => {
        await this.loadSelfId()

        // load ws events
        Object.keys(this.wsEvents).forEach((event) => {
            window.app.ws.listen(event, this.wsEvents[event])
        })

        await this.loadPosts()

        await this.setState({ initialLoading: false })
    }

    componentWillUnmount = async () => {
        // unload ws events
        Object.keys(this.wsEvents).forEach((event) => {
            window.app.ws.unlisten(event, this.wsEvents[event])
        })
    }

    loadSelfId = async () => {
        const selfId = await User.selfUserId()

        this.setState({
            selfId: selfId,
        })
    }

    loadPosts = async ({
        startIndex,
        stopIndex,
    } = {}) => {
        const result = await this.api.get.feed(undefined, {
            startIndex,
            stopIndex,
            feedLength: this.props.feedLength,
            user_id: this.props.fromUserId,
        })

        console.log(result)

        if (result) {
            this.setState({
                renderList: result.map((item, index) => this.getPostRender(item, index))
            })
        }
    }

    onLikePost = async (data) => {
        let result = await this.api.put.toogleLike({ post_id: data._id }).catch(() => {
            antd.message.error("Failed to like post")

            return false
        })

        return result
    }

    onDeletePost = async (data) => {
        let result = await this.api.delete.post({ post_id: data._id }).catch(() => {
            antd.message.error("Failed to delete post")

            return false
        })

        return result
    }

    insert = async (data) => {
        await this.setState({
            renderList: [this.getPostRender(data), ...this.state.renderList],
        })
    }

    remove = async (post_id) => {
        const updatedList = this.state.renderList

        const postIndex = updatedList.findIndex((item) => item.props.data._id === post_id)
        updatedList.splice(postIndex, 1)

        await this.setState({
            renderList: updatedList,
        })
    }

    getPostRender = (item, index) => {
        return <PostCard
            key={index ?? this.state.renderList.findIndex((i) => i._id === item._id)}
            data={item}
            selfId={this.state.selfId}
            events={{
                onClickLike: this.onLikePost,
                onClickDelete: this.onDeletePost,
            }}
        />
    }

    render() {
        if (this.state.initialLoading) {
            return <antd.Skeleton active />
        }

        if (this.state.renderList.length === 0) {
            return <div>
                <antd.Empty />
                <h1>Whoa, nothing on here...</h1>
            </div>
        }

        return <div className="postsFeed" ref={this.listRef}>
            {this.state.renderList}
        </div>
    }
}
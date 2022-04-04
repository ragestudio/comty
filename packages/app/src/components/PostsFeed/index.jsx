import React from "react"
import * as antd from "antd"
import { User } from "models"
import { PostCard } from "components"

import List from "rc-virtual-list"

import "./index.less"

export default class PostsFeed extends React.Component {
    state = {
        selfId: null,
        initialLoading: true,
        list: [],
        animating: false,
    }

    api = window.app.request
    listRef = React.createRef()

    componentDidMount = async () => {
        const selfId = await User.selfUserId()

        await this.registerWSEvents()
        await this.loadPosts()

        await this.setState({
            selfId: selfId,
            initialLoading: false,
        })
    }

    registerWSEvents = async () => {
        window.app.ws.listen(`post.new`, async (data) => {
            this.onInsert(data)
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
            this.setState({ list: result })
        }
    }

    onAppear = (...args) => {
        console.log('Appear:', args)
        this.setState({ animating: false })
    }

    lockForAnimation = () => {
        this.setState({ animating: true })
    }

    onInsert = async (data) => {
        const updatedList = this.state.list

        updatedList.unshift(data)

        await this.setState({
            list: updatedList,
        })

        this.lockForAnimation()
    }

    isSelf = (id) => {
        return this.state.selfId === id
    }

    render() {
        if (this.state.initialLoading) {
            return <antd.Skeleton active />
        }

        if (this.state.list.length === 0) {
            return <antd.Empty />
        }

        return <div
            className="postsFeed"
        >
            <List
                ref={this.listRef}
                data={this.state.list}
                height="80vh"
                itemHeight="100%"
                className="content"
            >
                {(item, index) => {
                    return <PostCard
                        data={item}
                        motionAppear={this.state.animating && index === 0}
                        onAppear={this.onAppear}
                        self={this.isSelf(item.user_id)}
                        selfId={this.state.selfId}
                    />
                }}
            </List>
        </div>
    }
}
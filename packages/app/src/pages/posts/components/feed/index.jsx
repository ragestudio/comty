import React from "react"
import { Skeleton } from "antd"

import { PostsList } from "components"

import FeedModel from "models/feed"

import "./index.less"

const emptyListRender = () => {
    return <div className="emptyFeed">
        <h2>
            We don't have any posts to show you.
        </h2>

        <p>
            Search for new people to follow on <a onClick={() => app.setLocation("/home/explore")}>explore</a> tab, to start view their posts.
        </p>
    </div>
}

export default class Feed extends React.Component {
    state = {
        loading: true,
        initialLoading: true,
        hasMorePosts: true,
        posts: [],
    }

    wsEvents = {
        "post.new": (data) => {
            this.setState({
                posts: [data, ...this.state.posts],
            })
        },
        "post.delete": (id) => {
            this.setState({
                posts: this.state.posts.filter((post) => {
                    return post._id !== id
                }),
            })
        }
    }

    loadData = async ({
        trim,
        replace = false
    } = {}) => {
        await this.setState({
            loading: true,
        })

        // get posts from api
        const result = await FeedModel.getPostsFeed({
            trim: trim ?? this.state.posts.length,
        })

        console.log("Loaded data => \n", result)

        if (result) {
            if (result.length === 0) {
                await this.setState({
                    hasMorePosts: false,
                    loading: false,
                    initialLoading: false,
                })

                return false
            }

            await this.setState({
                posts: replace ? result : [...this.state.posts, ...result],
            })
        }

        await this.setState({
            loading: false,
        })

        if (this.state.initialLoading) {
            await this.setState({
                initialLoading: false,
            })
        }
    }

    componentDidMount = async () => {
        await this.loadData()

        console.log(this.wsEvents)

        Object.keys(this.wsEvents).forEach((event) => {
            window.app.cores.api.namespaces["main"].listenEvent(event, this.wsEvents[event])
        })
    }

    componentWillUnmount = async () => {
        Object.keys(this.wsEvents).forEach((event) => {
            window.app.cores.api.namespaces["main"].unlistenEvent(event, this.wsEvents[event])
        })
    }

    render() {
        return <div className="feed">
            {
                this.state.initialLoading ? <Skeleton active /> : <PostsList
                    loading={this.state.loading}
                    hasMorePosts={this.state.hasMorePosts}
                    emptyListRender={emptyListRender}
                    onLoadMore={this.loadData}
                    posts={this.state.posts}
                    {
                    ...this.props
                    }
                />
            }
        </div>
    }
}
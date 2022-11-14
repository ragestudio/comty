import React from "react"
import { Skeleton } from "antd"
import { Icons } from "components/Icons"

import { PostsList } from "components"
import Post from "models/post"

import "./index.less"

export default class ExplorePosts extends React.Component {
    state = {
        loading: true,
        initialLoading: true,
        hasMorePosts: true,
        posts: [],
    }

    wsEvents = {
        "post.new": async (data) => {
            this.setState({
                posts: [data, ...this.state.posts],
            })
        },
        "post.delete": async (id) => {
            this.setState({
                posts: this.state.posts.filter((post) => {
                    return post._id !== id
                }),
            })
        }
    }

    loadPosts = async ({
        trim,
        replace = false
    } = {}) => {
        await this.setState({
            loading: true,
        })

        // get posts from api
        const result = await Post.getExplorePosts({
            trim: trim ?? this.state.posts.length,
        })

        console.log("Loaded posts => \n", result)

        if (result) {
            if (result.length === 0) {
                await this.setState({
                    hasMorePosts: false,
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
        await this.loadPosts()

        Object.keys(this.wsEvents).forEach((event) => {
            window.app.api.namespaces["main"].listenEvent(event, this.wsEvents[event])
        })
    }

    componentWillUnmount = async () => {
        Object.keys(this.wsEvents).forEach((event) => {
            window.app.api.namespaces["main"].unlistenEvent(event, this.wsEvents[event])
        })
    }

    render() {
        return <div className="postsExplore">
            <div className="postsExplore_header">
                <h1>
                    <Icons.Search /> Explore
                </h1>
            </div>
            {
                this.state.initialLoading ? <Skeleton active /> : <PostsList
                    loading={this.state.loading}
                    hasMorePosts={this.state.hasMorePosts}
                    onLoadMore={this.loadPosts}
                    posts={this.state.posts}
                />
            }
        </div>
    }
}
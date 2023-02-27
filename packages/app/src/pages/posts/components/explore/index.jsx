import React from "react"
import { Skeleton } from "antd"
import { Icons } from "components/Icons"

import { PostsList, Searcher } from "components"
import Post from "models/post"

import "./index.less"

export default class ExplorePosts extends React.Component {
    state = {
        loading: true,
        initialLoading: true,
        hasMorePosts: true,
        posts: [],
        focusedSearcher: false,
        filledSearcher: false,
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

    toggleFocusSearcher = (to) => {
        to = to ?? !this.state.focusedSearcher

        this.setState({
            focusedSearcher: to
        })
    }

    toggleState = (key, to) => {
        to = to ?? !this.state[key]

        this.setState({
            [key]: to
        })
    }

    componentDidMount = async () => {
        await this.loadPosts()

        Object.keys(this.wsEvents).forEach((event) => {
            app.cores.api.listenEvent(event, this.wsEvents[event])
        })
    }

    componentWillUnmount = async () => {
        Object.keys(this.wsEvents).forEach((event) => {
            app.cores.api.unlistenEvent(event, this.wsEvents[event])
        })
    }

    render() {
        return <div className="postsExplore">
            <div className="postsExplore_header">
                <Searcher
                    autoFocus={false}
                    onFocus={() => this.toggleState("focusedSearcher", true)}
                    onUnfocus={() => this.toggleState("focusedSearcher", false)}
                    onFilled={() => this.toggleState("filledSearcher", true)}
                    onEmpty={() => this.toggleState("filledSearcher", false)}
                />
            </div>
            {
                this.state.focusedSearcher || this.state.filledSearcher ? null : this.state.initialLoading ? <Skeleton active /> : <PostsList
                    loading={this.state.loading}
                    hasMorePosts={this.state.hasMorePosts}
                    onLoadMore={this.loadPosts}
                    posts={this.state.posts}
                />
            }
        </div>
    }
}
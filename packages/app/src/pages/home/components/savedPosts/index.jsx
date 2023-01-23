import React from "react"
import { Skeleton } from "antd"
import { Icons } from "components/Icons"

import { PostsList } from "components"
import Post from "models/post"

import "./index.less"

const emptyListRender = () => {
    return <div className="emptyFeed">
        <h2>
            You dont have any saved posts.
        </h2>
    </div>
}

export default class SavedPosts extends React.Component {
    state = {
        loading: true,
        initialLoading: true,
        hasMorePosts: true,
        posts: [],
    }

    loadData = async ({
        trim,
        replace = false
    } = {}) => {
        await this.setState({
            loading: true,
        })

        const result = await Post.getSavedPosts({
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

    componentDidMount() {
        this.loadData()
    }

    render() {
        return <div className="savedPosts">
            <div className="savedPosts_header">
                <h1>
                    <Icons.Bookmark />
                    Saved Posts
                </h1>
            </div>

            {
                this.state.initialLoading ? <Skeleton active /> : <PostsList
                    loading={this.state.loading}
                    hasMorePosts={this.state.hasMorePosts}
                    emptyListRender={emptyListRender}
                    onLoadMore={this.loadData}
                    posts={this.state.posts}
                />
            }
        </div>
    }
}
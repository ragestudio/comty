import React from "react"
import { Skeleton } from "antd"

import { PostsList } from "components"
import Post from "models/post"

const emptyListRender = () => {
    return <div className="emptyFeed">
        <h2>
            This user has no posts yet.
        </h2>
    </div>
}

export default class UserPosts extends React.Component {
    state = {
        loading: true,
        initialLoading: true,
        hasMorePosts: true,
        posts: [],
    }

    contentsRef = React.createRef()

    loadData = async ({
        trim,
        replace = false
    } = {}) => {
        await this.setState({
            loading: true,
        })

        const result = await Post.getUserPosts({
            user_id: this.props.state.user._id,
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
        return <div className="userPosts">
            {
                this.state.initialLoading ? <Skeleton active /> : <PostsList
                    loading={this.state.loading}
                    hasMorePosts={this.state.hasMorePosts}
                    emptyListRender={emptyListRender}
                    onLoadMore={this.loadData}
                    posts={this.state.posts}
                    ref={this.contentsRef}
                />
            }
        </div>
    }
}
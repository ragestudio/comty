import React from "react"
import { Skeleton, Result } from "antd"

import Post from "models/post"

import { PostsList } from "components"
import { Icons } from "components/Icons"

const emptyListRender = () => {
    return <Result
        icon={<Icons.UserX style={{ fontSize: "50px" }} />}
    >
        <h2>
            It's seems this user has no public post, yet.
        </h2>
    </Result>
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
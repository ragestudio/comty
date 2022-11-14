import React from "react"
import * as antd from "antd"
import { Icons } from "components/Icons"
import { PostCard, LoadMore } from "components"

import "./index.less"

const LoadingComponent = () => {
    // FIXME: Im not sure why but, using <antd.Skeleton> will cause a memory leak of DOM Nodes when using IntersectionObserver
    //return <antd.Skeleton active />

    return <p><Icons.LoadingOutlined spin className="loadingIcon" /> Loading more ...</p>
}

const NoResultComponent = () => {
    return <antd.Result
        status="info"
        title="This is the end"
        subTitle="We dont have more posts for you"
    />
}

// FIXME: Scroll behavior should scroll to next post or the previous one depending on the direction of the scroll
export default class PostsExplorer extends React.Component {
    state = {
        currentIndex: 0,
    }

    api = window.app.api.withEndpoints()

    listRef = React.createRef()

    componentDidMount = async () => {
        // TODO: register keybindings to handle directions key scrolling to posts (use app.shortcuts)
        window.app.shortcuts.register({
            id: "postsFeed.scrollUp",
            key: "ArrowUp",
            preventDefault: true,
        }, (event) => {
            this.scrollUp()
        })
        window.app.shortcuts.register({
            id: "postsFeed.scrollDown",
            key: "ArrowDown",
            preventDefault: true,
        }, (event) => {
            this.scrollDown()
        })
    }

    componentWillUnmount = async () => {
        window.app.shortcuts.remove("postsFeed.scrollUp")
        window.app.shortcuts.remove("postsFeed.scrollDown")
    }

    scrollUp = () => {
        this.scrollToIndex(this.state.currentIndex - 1)
    }

    scrollDown = () => {
        this.scrollToIndex(this.state.currentIndex + 1)
    }

    scrollToIndex = (index) => {
        const post = this.listRef.current.children[index]

        if (post) {
            post.scrollIntoView({ behavior: "smooth", block: "center" })
            this.setState({ currentIndex: index })
        }
    }

    handleScroll = (event) => {
        event.preventDefault()

        // check if is scrolling up or down
        const isScrollingUp = event.deltaY < 0

        // get current index
        const currentIndex = this.state.currentIndex

        // get next index
        const nextIndex = isScrollingUp ? currentIndex - 1 : currentIndex + 1

        // scroll to next index
        this.scrollToIndex(nextIndex)
    }

    onLikePost = async (data) => {
        let result = await this.api.post.toogleLike({ post_id: data._id }).catch(() => {
            antd.message.error("Failed to like post")

            return false
        })

        return result
    }

    onSavePost = async (data) => {
        let result = await this.api.post.postToogleSave({ post_id: data._id }).catch(() => {
            antd.message.error("Failed to save post")

            return false
        })

        return result
    }

    onDeletePost = async (data) => {
        antd.Modal.confirm({
            title: "Are you sure you want to delete this post?",
            content: "This action is irreversible",
            okText: "Yes",
            okType: "danger",
            cancelText: "No",
            onOk: async () => {
                await this.api.delete.post({ post_id: data._id }).catch(() => {
                    antd.message.error("Failed to delete post")
                })
            },
        })
    }

    onDoubleClickPost = (data) => {
        // open post
        app.setLocation(`/post/${data._id}`)
    }

    getPostRender = (item, index = this.props.posts.length) => {
        return <PostCard
            key={index}
            data={item}
            events={{
                onClickLike: this.onLikePost,
                onClickDelete: this.onDeletePost,
                onClickSave: this.onSavePost,
                onDoubleClick: this.onDoubleClickPost,
            }}
        />
    }

    render() {
        if (this.props.posts.length === 0) {
            if (typeof this.props.emptyListRender === "function") {
                return React.createElement(this.props.emptyListRender)
            }

            return <div className="no_more_posts">
                <antd.Empty />
                <h1>Whoa, nothing on here...</h1>
            </div>
        }

        return <div
            id="postsFeed"
            className="postsFeed"
            onScroll={this.handleScroll}
        >
            <LoadMore
                className="posts"
                ref={this.listRef}
                loadingComponent={LoadingComponent}
                noResultComponent={NoResultComponent}
                hasMore={this.props.hasMorePosts}
                onBottom={this.props.onLoadMore}
                fetching={this.props.loading}
            >
                {
                    this.props.posts.map((post, index) => {
                        return this.getPostRender(post, index)
                    })
                }
            </LoadMore>
        </div>
    }
}
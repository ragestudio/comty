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
export default class PostsFeed extends React.Component {
    state = {
        initialLoading: true,
        fetchingData: true,
        hasMorePosts: true,
        renderList: [],
        currentIndex: 0,
    }

    api = window.app.api.withEndpoints()

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
        // load ws events
        Object.keys(this.wsEvents).forEach((event) => {
            window.app.api.namespaces["main"].listenEvent(event, this.wsEvents[event])
        })

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

        await this.loadPosts()

        await this.setState({ initialLoading: false })
    }

    componentWillUnmount = async () => {
        // unload ws events
        Object.keys(this.wsEvents).forEach((event) => {
            window.app.api.namespaces["main"].unlistenEvent(event, this.wsEvents[event])
        })

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

    loadPosts = async ({
        trim,
        replace = false
    } = {}) => {
        // toogle fetching flag
        await this.setState({
            fetchingData: true,
        })

        // get posts from api
        const result = await this.api.get.feed(undefined, {
            trim: trim ?? this.state.renderList.length,
            limit: this.props.feedLength ?? window.app.settings.get("feed_max_fetch"),
            user_id: this.props.fromUserId,
            savedOnly: this.props.savedOnly,
        })

        console.log("Loaded Posts => \n", result)

        if (result) {
            // if result is empty, its mean there is no more posts, so set hasMorePosts to false
            if (result.length === 0) {
                await this.setState({
                    hasMorePosts: false,
                })
                return false
            }

            if (replace) {
                // replace all posts render list
                await this.setState({
                    renderList: result.map((item) => this.getPostRender(item, item.key))
                })
            } else {
                // else append posts to render list
                await this.setState({
                    renderList: [
                        ...this.state.renderList,
                        ...result.map((item) => this.getPostRender(item, item.key))
                    ]
                })
            }
        }

        // toogle fetching flag
        await this.setState({
            fetchingData: false,
        })
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

    getPostRender = (item, index = this.state.renderList.length) => {
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
        if (this.state.initialLoading) {
            return <antd.Skeleton active />
        }

        if (this.state.renderList.length === 0) {
            return <div>
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
                onBottom={() => {
                    this.loadPosts()
                }}
                loadingComponent={LoadingComponent}
                noResultComponent={NoResultComponent}
                fetching={this.state.fetchingData}
                hasMore={this.state.hasMorePosts}
                className="posts"
                ref={this.listRef}
            >
                {this.state.renderList}
            </LoadMore>
        </div>
    }
}
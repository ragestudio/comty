import React from "react"
import * as antd from "antd"
import { Icons } from "components/Icons"
import { PostCard, LoadMore } from "components"

import PostModel from "models/post"

import "./index.less"

const LoadingComponent = () => {
    // FIXME: Im not sure why but, using <antd.Skeleton> will cause a memory leak of DOM Nodes when using IntersectionObserver
    //return <antd.Skeleton active />

    return <p><Icons.LoadingOutlined spin className="loadingIcon" />Loading more ...</p>
}

const NoResultComponent = () => {
    return <antd.Result
        status="info"
        title="This is the end"
        subTitle="We dont have more posts for you"
    />
}

// FIXME: Scroll behavior should scroll to next post or the previous one depending on the direction of the scroll
export default class PostsLists extends React.Component {
    state = {
        currentIndex: 0,
        openPost: null,
        list: this.props.list ?? [],
    }

    listRef = React.createRef()

    timelineWsEvents = {
        "post.new": (data) => {
            console.log("New post => ", data)

            this.setState({
                list: [data, ...this.state.list],
            })
        },
        "post.delete": (id) => {
            console.log("Deleted post => ", id)

            this.setState({
                list: this.state.list.filter((post) => {
                    return post._id !== id
                }),
            })
        }
    }

    componentDidMount = async () => {
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

        if (this.props.watchTimeline) {
            Object.entries(this.timelineWsEvents).forEach(([event, callback]) => {
                app.cores.api.listenEvent(event, callback)
            })
        }
    }

    componentWillUnmount = async () => {
        window.app.shortcuts.remove("postsFeed.scrollUp")
        window.app.shortcuts.remove("postsFeed.scrollDown")

        if (this.props.watchTimeline) {
            Object.entries(this.timelineWsEvents).forEach(([event, callback]) => {
                app.cores.api.unlistenEvent(event, callback)
            })
        }
    }

    // watch if props.list has changed and update state.list
    componentDidUpdate = async (prevProps) => {
        if (prevProps.list !== this.props.list) {
            this.setState({
                list: this.props.list,
            })
        }
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
        let result = await PostModel.toogleLike({ post_id: data._id }).catch(() => {
            antd.message.error("Failed to like post")

            return false
        })

        return result
    }

    onSavePost = async (data) => {
        let result = await PostModel.toogleSave({ post_id: data._id }).catch(() => {
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
                await PostModel.deletePost({ post_id: data._id }).catch(() => {
                    antd.message.error("Failed to delete post")
                })
            },
        })
    }

    onToogleOpen = (to, data) => {
        if (typeof this.props.onOpenPost === "function") {
            this.props.onOpenPost(to, data)
        }
    }

    render() {
        if (this.state.list.length === 0) {
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
                    this.state.list.map((post, index) => {
                        console.log("Post => ", post, index)

                        return <PostCard
                            key={index}
                            data={post}
                            events={{
                                onToogleOpen: this.onToogleOpen,
                                onClickLike: this.onLikePost,
                                onClickDelete: this.onDeletePost,
                                onClickSave: this.onSavePost,
                            }}
                        />
                    })
                }
            </LoadMore>
        </div>
    }
}
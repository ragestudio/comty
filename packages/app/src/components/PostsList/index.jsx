import React from "react"
import * as antd from "antd"
import { Icons } from "components/Icons"
import { PostCard, LoadMore } from "components"
import { ViewportList } from "react-viewport-list"

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

export class PostsListsComponent extends React.Component {
    state = {
        openPost: null,

        loading: false,
        initialLoading: true,

        realtimeUpdates: true,

        hasMore: true,
        list: this.props.list ?? [],
    }

    viewRef = this.props.innerRef

    timelineWsEvents = {
        "post.new": (data) => {
            console.log("New post => ", data)

            if (!this.state.realtimeUpdates) {
                return
            }

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

    handleLoad = async (fn) => {
        this.setState({
            loading: true,
        })

        const result = await fn({
            trim: this.state.list.length,
        }).catch((err) => {
            console.error(err)

            app.message.error("Failed to load more posts")

            return null
        })

        if (result) {
            if (result.length === 0) {
                return this.setState({
                    hasMore: false,
                })
            }

            this.setState({
                list: [...this.state.list, ...result],
            })
        }

        this.setState({
            loading: false,
        })
    }

    addPost = (post) => {
        this.setState({
            list: [post, ...this.state.list],
        })
    }

    removePost = (id) => {
        this.setState({
            list: this.state.list.filter((post) => {
                return post._id !== id
            }),
        })
    }

    _hacks = {
        addPost: this.addPost,
        removePost: this.removePost,
        addRandomPost: () => {
            this.addPost({
                _id: Math.random().toString(36).substring(7),
                message: `Random post ${Math.random().toString(36).substring(7)}`,
                user: {
                    _id: Math.random().toString(36).substring(7),
                    username: "random user",
                }
            })
        }
    }

    onResumeRealtimeUpdates = async () => {
        // fetch new posts
        await this.handleLoad(this.props.loadFromModel)

        this.setState({
            realtimeUpdates: true,
        })
    }

    onScrollList = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target

        if (scrollTop + clientHeight >= scrollHeight - 100) {
            this.setState({
                realtimeUpdates: false,
            })
        }
    }

    componentDidMount = async () => {
        if (typeof this.props.loadFromModel === "function") {
            await this.handleLoad(this.props.loadFromModel)
        }

        this.setState({
            initialLoading: false,
        })

        if (this.props.watchTimeline) {
            Object.entries(this.timelineWsEvents).forEach(([event, callback]) => {
                app.cores.api.listenEvent(event, callback)
            })
        }

        //console.log("PostsList mounted", this.viewRef)

        if (this.viewRef) {
            // handle when the user is scrolling a bit down, disable ws events
            this.viewRef.current.addEventListener("scroll", this.onScrollList)
        }

        window._hacks = this._hacks
    }

    componentWillUnmount = async () => {
        if (this.props.watchTimeline) {
            Object.entries(this.timelineWsEvents).forEach(([event, callback]) => {
                app.cores.api.unlistenEvent(event, callback)
            })
        }

        if (this.viewRef) {
            this.viewRef.current.removeEventListener("scroll", this.onScrollList)
        }

        window._hacks = null
    }

    componentDidUpdate = async (prevProps) => {
        if (prevProps.list !== this.props.list) {
            this.setState({
                list: this.props.list,
            })
        }
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

    onLoadMore = async () => {
        if (typeof this.props.onLoadMore === "function") {
            return this.handleLoad(this.props.onLoadMore)
        }
    }

    render() {
        if (this.state.initialLoading) {
            return <antd.Skeleton active />
        }

        if (this.state.list.length === 0) {
            if (typeof this.props.emptyListRender === "function") {
                return React.createElement(this.props.emptyListRender)
            }

            return <div className="no_more_posts">
                <antd.Empty />
                <h1>Whoa, nothing on here...</h1>
            </div>
        }

        return <LoadMore
            className="postList"
            loadingComponent={LoadingComponent}
            noResultComponent={NoResultComponent}
            hasMore={this.state.hasMore}
            fetching={this.state.loading}
            onBottom={this.onLoadMore}
        >
            {
                !this.state.realtimeUpdates && <div className="realtime_updates_disabled">
                    <antd.Alert
                        message="Realtime updates disabled"
                        description="You are scrolling down, realtime updates are disabled to improve performance"
                        type="warning"
                        showIcon
                    />
                </div>
            }
            <ViewportList
                viewportRef={this.viewRef}
                items={this.state.list}
            >
                {
                    (item) => <PostCard
                        key={item._id}
                        data={item}
                        events={{
                            onClickLike: this.onLikePost,
                            onClickSave: this.onSavePost,
                            onClickDelete: this.onDeletePost,
                            onClickEdit: this.onEditPost,
                        }}
                    />
                }
            </ViewportList>
        </LoadMore>
    }
}

export default React.forwardRef((props, ref) => <PostsListsComponent innerRef={ref} {...props} />)
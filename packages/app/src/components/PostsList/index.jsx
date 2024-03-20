import React from "react"
import * as antd from "antd"
import { Icons } from "components/Icons"
import { AnimatePresence } from "framer-motion"

import PostCard from "components/PostCard"
import PlaylistTimelineEntry from "components/Music/PlaylistTimelineEntry"
import LoadMore from "components/LoadMore"

import PostModel from "models/post"

import "./index.less"

const LoadingComponent = () => {
    return <div className="post_card">
        <antd.Skeleton
            avatar
            style={{
                width: "100%"
            }}
        />
    </div>
}

const NoResultComponent = () => {
    return <antd.Empty
        description="No more post here"
        style={{
            width: "100%"
        }}
    />
}

const typeToComponent = {
    "post": (args) => <PostCard {...args} />,
    "playlist": (args) => <PlaylistTimelineEntry {...args} />,
}

const Entry = React.memo((props) => {
    const { data } = props

    return React.createElement(typeToComponent[data.type ?? "post"] ?? PostCard, {
        key: data._id,
        data: data,
        disableReplyTag: props.disableReplyTag,
        disableHasReplies: props.disableHasReplies,
        events: {
            onClickLike: props.onLikePost,
            onClickSave: props.onSavePost,
            onClickDelete: props.onDeletePost,
            onClickEdit: props.onEditPost,
            onClickReply: props.onReplyPost,
            onDoubleClick: props.onDoubleClick,
        },
    })
})

const PostList = React.forwardRef((props, ref) => {
    return <LoadMore
        ref={ref}
        className="post-list"
        loadingComponent={LoadingComponent}
        noResultComponent={NoResultComponent}
        hasMore={props.hasMore}
        fetching={props.loading}
        onBottom={props.onLoadMore}
    >
        {
            !props.realtimeUpdates && !app.isMobile && <div className="resume_btn_wrapper">
                <antd.Button
                    type="primary"
                    shape="round"
                    onClick={props.onResumeRealtimeUpdates}
                    loading={props.resumingLoading}
                    icon={<Icons.SyncOutlined />}
                >
                    Resume
                </antd.Button>
            </div>
        }

        <AnimatePresence>
            {
                props.list.map((data) => {
                    return <Entry
                        key={data._id}
                        data={data}
                        {...props}
                    />
                })
            }
        </AnimatePresence>
    </LoadMore>

})

export class PostsListsComponent extends React.Component {
    state = {
        openPost: null,

        loading: false,
        resumingLoading: false,
        initialLoading: true,
        scrollingToTop: false,

        topVisible: true,

        realtimeUpdates: true,

        hasMore: true,
        list: this.props.list ?? [],
    }

    parentRef = this.props.innerRef
    listRef = React.createRef()

    timelineWsEvents = {
        "feed.new": (data) => {
            console.log("New feed => ", data)

            if (!this.state.realtimeUpdates) {
                return
            }

            this.setState({
                list: [data, ...this.state.list],
            })
        },
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

    handleLoad = async (fn, params = {}) => {
        this.setState({
            loading: true,
        })

        let payload = {
            trim: this.state.list.length,
            limit: app.cores.settings.get("feed_max_fetch"),
        }

        if (this.props.loadFromModelProps) {
            payload = {
                ...payload,
                ...this.props.loadFromModelProps,
            }
        }

        if (params.replace) {
            payload.trim = 0
        }

        const result = await fn(payload).catch((err) => {
            console.error(err)

            app.message.error("Failed to load more posts")

            return null
        })

        console.log("Loaded posts => ", result)

        if (result) {
            if (result.length === 0) {
                return this.setState({
                    hasMore: false,
                })
            }

            if (params.replace) {
                this.setState({
                    list: result,
                })
            } else {
                this.setState({
                    list: [...this.state.list, ...result],
                })
            }
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
            const randomId = Math.random().toString(36).substring(7)

            this.addPost({
                _id: randomId,
                message: `Random post ${randomId}`,
                user: {
                    _id: randomId,
                    username: "random user",
                    avatar: `https://api.dicebear.com/7.x/thumbs/svg?seed=${randomId}`,
                }
            })
        },
        listRef: this.listRef,
    }

    onResumeRealtimeUpdates = async () => {
        console.log("Resuming realtime updates")

        this.setState({
            resumingLoading: true,
            scrollingToTop: true,
        })

        this.listRef.current.scrollTo({
            top: 0,
            behavior: "smooth",
        })

        // reload posts
        await this.handleLoad(this.props.loadFromModel, {
            replace: true,
        })

        this.setState({
            realtimeUpdates: true,
            resumingLoading: false,
        })
    }

    onScrollList = (e) => {
        const { scrollTop } = e.target

        if (this.state.scrollingToTop && scrollTop === 0) {
            this.setState({
                scrollingToTop: false,
            })
        }

        if (scrollTop > 200) {
            if (this.state.topVisible) {
                this.setState({
                    topVisible: false,
                })

                if (typeof this.props.onTopVisibility === "function") {
                    this.props.onTopVisibility(false)
                }
            }

            if (!this.props.realtime || this.state.resumingLoading || this.state.scrollingToTop) {
                return null
            }

            this.setState({
                realtimeUpdates: false,
            })
        } else {
            if (!this.state.topVisible) {
                this.setState({
                    topVisible: true,
                })

                if (typeof this.props.onTopVisibility === "function") {
                    this.props.onTopVisibility(true)
                }

                // if (this.props.realtime || !this.state.realtimeUpdates && !this.state.resumingLoading && scrollTop < 5) {
                //     this.onResumeRealtimeUpdates()
                // }
            }
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
            if (!Array.isArray(this.props.watchTimeline)) {
                console.error("watchTimeline prop must be an array")
            } else {
                this.props.watchTimeline.forEach((event) => {
                    if (typeof this.timelineWsEvents[event] !== "function") {
                        console.error(`The event "${event}" is not defined in the timelineWsEvents object`)
                    }

                    app.cores.api.listenEvent(event, this.timelineWsEvents[event], "posts")
                })
            }
        }

        if (this.listRef && this.listRef.current) {
            this.listRef.current.addEventListener("scroll", this.onScrollList)
        }

        window._hacks = this._hacks
    }

    componentWillUnmount = async () => {
        if (this.props.watchTimeline) {
            if (!Array.isArray(this.props.watchTimeline)) {
                console.error("watchTimeline prop must be an array")
            } else {
                this.props.watchTimeline.forEach((event) => {
                    if (typeof this.timelineWsEvents[event] !== "function") {
                        console.error(`The event "${event}" is not defined in the timelineWsEvents object`)
                    }

                    app.cores.api.unlistenEvent(event, this.timelineWsEvents[event], "posts")
                })
            }
        }

        if (this.listRef && this.listRef.current) {
            this.listRef.current.removeEventListener("scroll", this.onScrollList)
        }

        window._hacks = null
    }

    componentDidUpdate = async (prevProps, prevState) => {
        if (prevProps.list !== this.props.list) {
            this.setState({
                list: this.props.list,
            })
        }
    }

    onLikePost = async (data) => {
        let result = await PostModel.toggleLike({ post_id: data._id }).catch(() => {
            antd.message.error("Failed to like post")

            return false
        })

        return result
    }

    onSavePost = async (data) => {
        let result = await PostModel.toggleSave({ post_id: data._id }).catch(() => {
            antd.message.error("Failed to save post")

            return false
        })

        return result
    }

    onEditPost = (data) => {
        app.controls.openPostCreator({
            edit_post: data._id,
        })
    }

    onReplyPost = (data) => {
        app.controls.openPostCreator({
            reply_to: data._id,
        })
    }

    onDoubleClickPost = (data) => {
        app.navigation.goToPost(data._id)
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

    ontoggleOpen = (to, data) => {
        if (typeof this.props.onOpenPost === "function") {
            this.props.onOpenPost(to, data)
        }
    }

    onLoadMore = async () => {
        if (typeof this.props.onLoadMore === "function") {
            return this.handleLoad(this.props.onLoadMore)
        } else if (this.props.loadFromModel) {
            return this.handleLoad(this.props.loadFromModel)
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

        const PostListProps = {
            list: this.state.list,

            disableReplyTag: this.props.disableReplyTag,
            disableHasReplies: this.props.disableHasReplies,

            onLikePost: this.onLikePost,
            onSavePost: this.onSavePost,
            onDeletePost: this.onDeletePost,
            onEditPost: this.onEditPost,
            onReplyPost: this.onReplyPost,
            onDoubleClick: this.onDoubleClickPost,

            onLoadMore: this.onLoadMore,
            hasMore: this.state.hasMore,
            loading: this.state.loading,

            realtimeUpdates: this.state.realtimeUpdates,
            resumingLoading: this.state.resumingLoading,
            onResumeRealtimeUpdates: this.onResumeRealtimeUpdates,
        }

        if (app.isMobile) {
            return <PostList
                ref={this.listRef}
                {...PostListProps}
            />
        }

        return <div className="post-list_wrapper">
            <PostList
                ref={this.listRef}
                {...PostListProps}
            />
        </div>
    }
}

export default React.forwardRef((props, ref) => <PostsListsComponent innerRef={ref} {...props} />)
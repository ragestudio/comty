import React from "react"
import * as antd from "antd"
import { Icons } from "components/Icons"

import PostCard from "components/PostCard"
import PlaylistTimelineEntry from "components/PlaylistTimelineEntry"
import LoadMore from "components/LoadMore"

//import { ViewportList } from "react-viewport-list"
import AutoSizer from "react-virtualized-auto-sizer"

import PostModel from "models/post"

import "./index.less"

const LoadingComponent = () => {
    return <antd.Skeleton avatar
        style={{
            padding: "20px",
            width: "35vw",
            height: "160px",
        }}
    />
}

const NoResultComponent = () => {
    return <antd.Result
        status="info"
        title="This is the end"
        subTitle="We dont have more posts for you"
    />
}

const typeToComponent = {
    "post": (args) => <PostCard {...args} />,
    "playlist": (args) => <PlaylistTimelineEntry {...args} />,
}

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
            this.addPost({
                _id: Math.random().toString(36).substring(7),
                message: `Random post ${Math.random().toString(36).substring(7)}`,
                user: {
                    _id: Math.random().toString(36).substring(7),
                    username: "random user",
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

                    app.cores.api.listenEvent(event, this.timelineWsEvents[event])
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

                    app.cores.api.unlistenEvent(event, this.timelineWsEvents[event])
                })
            }
        }

        if (this.listRef && this.listRef.current) {
            this.listRef.current.removeEventListener("scroll", this.onScrollList)
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

        return <AutoSizer
            disableWidth
        >
            {({ height }) => {
                console.log("[PostList] AutoSizer height update => ", height)

                return <LoadMore
                    ref={this.listRef}
                    contentProps={{
                        style: { height }
                    }}
                    className="postList"
                    loadingComponent={LoadingComponent}
                    noResultComponent={NoResultComponent}
                    hasMore={this.state.hasMore}
                    fetching={this.state.loading}
                    onBottom={this.onLoadMore}
                >
                    {
                        !this.state.realtimeUpdates && <div className="resume_btn_wrapper">
                            <antd.Button
                                type="primary"
                                shape="round"
                                onClick={this.onResumeRealtimeUpdates}
                                loading={this.state.resumingLoading}
                                icon={<Icons.SyncOutlined />}
                            >
                                Resume
                            </antd.Button>
                        </div>
                    }
                    {
                        this.state.list.map((data) => {
                            return React.createElement(typeToComponent[data.type ?? "post"], {
                                key: data._id,
                                data: data,
                                events: {
                                    onClickLike: this.onLikePost,
                                    onClickSave: this.onSavePost,
                                    onClickDelete: this.onDeletePost,
                                    onClickEdit: this.onEditPost,
                                }
                            })
                        })
                    }
                </LoadMore>
            }}
        </AutoSizer>
    }
}

export default React.forwardRef((props, ref) => <PostsListsComponent innerRef={ref} {...props} />)
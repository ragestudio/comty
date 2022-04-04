import React from "react"
import * as antd from "antd"
import { Swiper } from "antd-mobile"
import { Icons } from "components/Icons"
import { LikeButton } from "components"
import moment from "moment"
import classnames from "classnames"
import loadable from "@loadable/component"

import CSSMotion from "rc-animate/lib/CSSMotion"
import useLayoutEffect from "rc-util/lib/hooks/useLayoutEffect"

import "./index.less"

const ContentFailed = () => {
    return <div className="contentFailed">
        <Icons.MdCloudOff />
    </div>
}

const getCurrentHeight = (node) => ({ height: node.offsetHeight })

const getMaxHeight = (node) => {
    return { height: node.scrollHeight }
}

const getCollapsedHeight = () => ({ height: 0, opacity: 0 })

function PostHeader(props) {
    const [timeAgo, setTimeAgo] = React.useState(0)

    const goToProfile = () => {
        window.app.goToAccount(props.postData.user?.username)
    }

    const updateTimeAgo = () => {
        setTimeAgo(moment(props.postData.created_at ?? "").fromNow())
    }

    React.useEffect(() => {
        updateTimeAgo()

        const interval = setInterval(() => {
            updateTimeAgo()
        }, 10000)

        return () => {
            clearInterval(interval)
        }
    }, [props.postData.created_at])

    return <div className="postHeader">
        <div className="userInfo">
            <div className="avatar">
                <antd.Avatar shape="square" src={props.postData.user?.avatar} />
            </div>
            <div className="info">
                <div>
                    <h1 onClick={goToProfile}>
                        {props.postData.user?.fullName ?? `@${props.postData.user?.username}`}
                        {props.postData.user?.verified && <Icons.verifiedBadge />}
                    </h1>
                </div>

                <div>
                    {timeAgo}
                </div>
            </div>
        </div>
        <div className="postStatistics">
            <div className="item">
                <Icons.Heart className={classnames("icon", { ["filled"]: props.isLiked })} />
                <div className="value">
                    {props.likes}
                </div>
            </div>
            <div className="item">
                <Icons.MessageSquare />
                <div className="value">
                    {props.comments}
                </div>
            </div>
        </div>
    </div>
}

const PostContent = React.memo((props) => {
    let { message, additions } = props.data

    // first filter if is an string
    additions = additions.filter(file => typeof file === "string")

    // then filter if is an uri
    additions = additions.filter(file => /^(http|https):\/\//.test(file))

    additions = additions.map((uri, index) => {
        const MediaRender = loadable(async () => {
            // create a basic http request for fetching the file media type
            const request = new Request(uri, {
                method: "HEAD",
            })

            // fetch the file media type
            const mediaType = await fetch(request)
                .then(response => response.headers.get("content-type"))
                .catch((error) => {
                    console.error(error)
                    return null
                })

            if (!mediaType) {
                return () => <ContentFailed />
            }

            switch (mediaType.split("/")[0]) {
                case "image": {
                    return () => <img src={uri} />
                }
                case "video": {
                    return () => <video controls>
                        <source src={uri} type={mediaType} />
                    </video>
                }
                case "audio": {
                    return () => <audio controls>
                        <source src={uri} type={mediaType} />
                    </audio>
                }

                default: {
                    return () => <h4>
                        Unsupported media type [{mediaType}]
                    </h4>
                }
            }
        })

        return <Swiper.Item
            key={index}
        >
            <div className="addition">
                <React.Suspense fallback={<div>Loading</div>} >
                    <MediaRender />
                </React.Suspense>
            </div>
        </Swiper.Item>
    })


    return <div className="content">
        {message}

        {additions &&
            <div className="additions">
                <Swiper
                    direction="vertical"
                    indicatorProps={{
                        style: {
                            '--dot-color': 'rgba(0, 0, 0, 0.4)',
                            '--active-dot-color': '#ffc0cb',
                            '--dot-size': '50px',
                            '--active-dot-size': '30px',
                            '--dot-border-radius': '50%',
                            '--active-dot-border-radius': '15px',
                            '--dot-spacing': '8px',
                        }
                    }}
                >
                    {additions}
                </Swiper>
            </div>
        }
    </div>
})

const PostActions = (props) => {
    const handleSelfMenuAction = async (event) => {
        const fn = props.actions[event.key]

        if (typeof fn === "function") {
            await fn()
        }
    }

    return <div className="actions">
        <div className="action" id="likes">
            <div className="icon">
                <LikeButton defaultLiked={props.defaultLiked} onClick={props.onClickLike} />
            </div>
        </div>
        <div className="action" id="comments" onClick={props.onClickComments}>
            <div className="icon">
                <Icons.MessageSquare className="icon" />
            </div>
        </div>
        <div className="action" id="save" onClick={props.onClickSave}>
            <div className="icon">
                <Icons.Bookmark />
            </div>
        </div>
        {props.self && <div className="action" id="selfMenu" onClick={props.onClickSelfMenu}>
            <antd.Dropdown
                overlay={<antd.Menu
                    onClick={handleSelfMenuAction}
                >
                    <antd.Menu.Item icon={<Icons.Edit />} key="edit">
                        Edit
                    </antd.Menu.Item>
                    <antd.Menu.Divider />
                    <antd.Menu.Item icon={<Icons.Trash />} key="delete">
                        Delete
                    </antd.Menu.Item>
                </antd.Menu>}
                trigger={['click']}
            >
                <div className="icon">
                    <Icons.MoreVertical />
                </div>
            </antd.Dropdown>
        </div>}
    </div>
}

export class PostCard extends React.Component {
    state = {
        loading: true,
        likes: this.props.data.likes,
        comments: this.props.data.comments,
    }

    api = window.app.request

    componentDidMount = async () => {
        window.app.ws.listen(`post.like.${this.props.data._id}`, async (data) => {
            await this.setState({ likes: data })
        })
        window.app.ws.listen(`post.unlike.${this.props.data._id}`, async (data) => {
            await this.setState({ likes: data })
        })

        window.app.ws.listen(`post.comment.${this.props.data._id}`, async (data) => {
            await this.setState({ comments: data })
        })
        window.app.ws.listen(`post.uncomment.${this.props.data._id}`, async (data) => {
            await this.setState({ comments: data })
        })

        await this.setState({
            loading: false
        })
    }

    onClickDelete = async () => {
        const result = await this.api.delete.post({
            post_id: this.props.data._id,
        }).catch(error => {
            console.error(error)
            antd.message.error(error.message)

            return {
                success: false,
            }
        })

        if (result.success) {
            if (typeof this.props.close === "function") {
                this.props.close()
            }
        }
    }

    onClickLike = async (to) => {
        let result = false

        if (to) {
            const apiResult = await this.api.put.like({ post_id: this.props.data._id })
            result = apiResult.success
        } else {
            const apiResult = await this.api.put.unlike({ post_id: this.props.data._id })
            result = apiResult.success
        }

        return result
    }

    onClickSave = async () => {
        // TODO
    }

    onClickEdit = async () => {
        // TODO
    }

    hasLiked = () => {
        return this.state.likes.some((user_id) => user_id === this.props.selfId)
    }

    render() {
        const hasLiked = this.hasLiked()

        if (this.state.loading) {
            return <antd.Skeleton active />
        }

        return <div
            id={this.props.data._id}
            key={this.props.data._id}
            className={classnames("postCard", { ["liked"]: hasLiked })}
        >
            <div className="wrapper">
                <PostHeader
                    postData={this.props.data}
                    isLiked={hasLiked}
                    likes={this.state.likes.length}
                    comments={this.state.comments.length}
                />
                <PostContent
                    data={this.props.data}
                />
            </div>
            <div className="actionsIndicatorWrapper">
                <div className="actionsIndicator">
                    <Icons.MoreHorizontal />
                </div>
            </div>
            <div className="actionsWrapper">
                <PostActions
                    self={this.props.self}
                    onClickLike={this.onClickLike}
                    defaultLiked={hasLiked}
                    actions={{
                        edit: this.onClickEdit,
                        delete: this.onClickDelete,
                    }}
                />
            </div>
        </div>
    }
}

export const PostCardAnimated = (props, ref,) => {
    const motionRef = React.useRef(false)

    useLayoutEffect(() => {
        return () => {
            if (motionRef.current) {
                props.onAppear()
            }
        }
    }, [])

    return <CSSMotion
        ref={ref}
        motionName="motion"
        motionAppear={props.motionAppear}
        onAppearStart={getCollapsedHeight}
        onAppearActive={node => {
            motionRef.current = true
            return getMaxHeight(node)
        }}
        onAppearEnd={props.onAppear}
        onLeaveStart={getCurrentHeight}
        onLeaveActive={getCollapsedHeight}
        onLeaveEnd={() => {
            props.onLeave(id)
        }}
    >
        {(_args, passedMotionRef) => {
            return <PostCard
                ref={passedMotionRef}
                {...props}
            />
        }}
    </CSSMotion>
}

export const ForwardedPostCardAnimated = React.forwardRef(PostCardAnimated)

export default ForwardedPostCardAnimated
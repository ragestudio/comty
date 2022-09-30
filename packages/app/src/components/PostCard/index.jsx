import React from "react"
import * as antd from "antd"
import { Icons } from "components/Icons"
import { Image, LikeButton } from "components"
import moment from "moment"
import classnames from "classnames"
import loadable from "@loadable/component"

import { processString } from "utils"

import CSSMotion from "rc-animate/lib/CSSMotion"
import useLayoutEffect from "rc-util/lib/hooks/useLayoutEffect"

import "./index.less"

const mediaTypes = {
    "jpg": "image",
    "jpeg": "image",
    "png": "image",
    "gif": "image",
    "mp4": "video",
    "webm": "video",
    "ogv": "video",
    "mov": "video",
    "avi": "video",
    "mkv": "video",
    "ogg": "audio",
    "mp3": "audio",
    "wav": "audio",
    "flac": "audio",
    "aac": "audio",
    "m4a": "audio",
}

const SaveButton = (props) => {
    const [saved, setSaved] = React.useState(props.defaultActive)

    const onClick = async () => {
        props.onClick({
            to: !saved,
        })
        setSaved(!saved)
    }

    return <antd.Button
        className={classnames("saveButton", {
            ["active"]: saved
        })}
        shape="circle"
        onClick={onClick}
        icon={saved ? <Icons.MdBookmark /> : <Icons.MdBookmarkBorder />}
        size="large"
    />
}

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

export function PostHeader(props) {
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

    return <div className="postHeader" onDoubleClick={props.onDoubleClick}>
        <div className="userInfo">
            <div className="avatar">
                <Image
                    alt="Avatar"
                    src={props.postData.user?.avatar}
                />
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

export class PostAdditions extends React.PureComponent {
    getAdditions = (data) => {
        return data.map((addition, index) => {
            if (typeof addition === "string") {
                addition = {
                    url: addition,
                }
            }

            const { url, id, name } = addition

            const MediaRender = loadable(async () => {
                let extension = null

                try {
                    // get media type by parsing the url
                    const mediaTypeExt = /\.([a-zA-Z0-9]+)$/.exec(url)

                    if (mediaTypeExt) {
                        extension = mediaTypeExt[1]
                    } else {
                        // try to get media by creating requesting the url
                        const response = await fetch(url, {
                            method: "HEAD",
                        })

                        extension = response.headers.get("content-type").split("/")[1]
                    }

                    extension = extension.toLowerCase()

                    const mediaType = mediaTypes[extension]
                    const mimeType = `${mediaType}/${extension}`

                    if (!mediaType) {
                        return () => <ContentFailed />
                    }

                    switch (mediaType.split("/")[0]) {
                        case "image": {
                            return () => <img src={url} />
                        }
                        case "video": {
                            return () => <video controls>
                                <source src={url} type={mimeType} />
                            </video>
                        }
                        case "audio": {
                            return () => <audio controls>
                                <source src={url} type={mimeType} />
                            </audio>
                        }

                        default: {
                            return () => <h4>
                                Unsupported media type [{mediaType}/{mediaTypeExt}]
                            </h4>
                        }
                    }
                } catch (error) {
                    console.error(error)
                    return () => <ContentFailed />
                }
            })

            return <div key={index} className="addition">
                <React.Suspense fallback={<div>Loading</div>} >
                    <MediaRender />
                </React.Suspense>
            </div>
        })
    }

    render() {
        return <div className="additions">
            <antd.Carousel
                arrows={true}
                nextArrow={<Icons.ChevronRight />}
                prevArrow={<Icons.ChevronLeft />}
                autoplay={this.props.autoCarrousel}
            >
                {this.getAdditions(this.props.additions)}
            </antd.Carousel>
        </div>
    }
}

export const PostContent = React.memo((props) => {
    let { message, additions, type, data } = props.data

    if (typeof data === "string") {
        try {
            data = JSON.parse(data)
        } catch (error) {
            console.error(error)
            data = {}
        }
    }

    const onClickPlaylist = () => {
        if (data.playlist) {
            app.AudioPlayer.startPlaylist(data.playlist)
        }
    }

    // parse message
    const regexs = [
        {
            regex: /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi,
            fn: (key, result) => {
                return <a key={key} href={result[1]} target="_blank" rel="noopener noreferrer">{result[1]}</a>
            }
        },
        {
            regex: /(@[a-zA-Z0-9_]+)/gi,
            fn: (key, result) => {
                return <a key={key} onClick={() => window.app.setLocation(`/@${result[1].substr(1)}`)}>{result[1]}</a>
            }
        },
    ]

    message = processString(regexs)(message)

    const renderContent = () => {
        switch (type) {
            case "playlist": {
                return <>
                    <div
                        className="playlistCover"
                        onClick={onClickPlaylist}
                        style={{
                            backgroundImage: `url(${data?.cover ?? "/assets/no_song.png"})`,
                        }}
                    />

                    <div className="playlistTitle">
                        <div>
                            <h1>
                                {data.title ?? "Untitled Playlist"}
                            </h1>
                            <h3>
                                {data.artist}
                            </h3>
                        </div>

                        <h4>
                            {message}
                        </h4>

                        <div className="actions">
                            <antd.Button onClick={onClickPlaylist}>
                                <Icons.PlayCircle />
                                Play
                            </antd.Button>
                        </div>
                    </div>
                </>
            }
            default: {
                return <>
                    <div className="message">
                        {message}
                    </div>

                    {additions.length > 0 && <PostAdditions additions={additions} />}
                </>
            }
        }
    }

    return <div
        className="content"
        onDoubleClick={props.onDoubleClick}
    >
        {renderContent()}
    </div>
})

export const PostActions = (props) => {
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
        <div className={"action"} id="save">
            <div className="icon">
                <SaveButton defaultActive={props.defaultSaved} onClick={props.onClickSave} />
            </div>
        </div>
        {props.isSelf && <div className="action" id="selfMenu" onClick={props.onClickSelfMenu}>
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
                trigger={["click"]}
            >
                <div className="icon">
                    <Icons.MoreVertical />
                </div>
            </antd.Dropdown>
        </div>}
    </div>
}

export const PostCard = React.memo(({
    selfId,
    expansibleActions = window.app.settings.get("postCard_expansible_actions"),
    autoCarrousel = window.app.settings.get("postCard_carrusel_auto"),
    data = {},
    events = {},
    fullmode
}) => {
    const [loading, setLoading] = React.useState(true)
    const [likes, setLikes] = React.useState(data.likes ?? [])
    const [comments, setComments] = React.useState(data.comments ?? [])

    const [hasLiked, setHasLiked] = React.useState(false)
    const [hasSaved, setHasSaved] = React.useState(false)

    const onClickDelete = async () => {
        if (typeof events.onClickDelete !== "function") {
            console.warn("onClickDelete event is not a function")
            return
        }

        return await events.onClickDelete(data)
    }

    const onClickLike = async () => {
        if (typeof events.onClickLike !== "function") {
            console.warn("onClickLike event is not a function")
            return
        }

        return await events.onClickLike(data)
    }

    const onClickSave = async () => {
        if (typeof events.onClickSave !== "function") {
            console.warn("onClickSave event is not a function")
            return
        }

        return await events.onClickSave(data)
    }

    const onDataUpdate = (data) => {
        setLikes(data.likes)
        setComments(data.comments)
    }

    const onDoubleClick = () => {
        if (typeof events.onDoubleClick !== "function") {
            console.warn("onDoubleClick event is not a function")
            return
        }

        return events.onDoubleClick(data)
    }

    React.useEffect(() => {
        if (fullmode) {
            app.eventBus.emit("style.compactMode", true)
        }

        return () => {
            app.eventBus.emit("style.compactMode", false)
        }
    }, [])

    React.useEffect(() => {
        // first listen to post changes
        window.app.api.namespaces["main"].listenEvent(`post.dataUpdate.${data._id}`, onDataUpdate)

        // proccess post info
        // {...}

        // then load
        setLoading(false)

        return () => {
            // remove the listener
            window.app.api.namespaces["main"].unlistenEvent(`post.dataUpdate.${data._id}`, onDataUpdate)
        }
    }, [])

    React.useEffect(() => {
        // check if the post has liked by you
        const hasLiked = likes.includes(selfId)
        const hasSaved = data.isSaved

        //console.log(`[${data._id}] CHECKING LIKE OF USER ${selfId} > ${hasLiked}`)

        setHasLiked(hasLiked)
        setHasSaved(hasSaved)
    })

    if (loading) {
        return <antd.Skeleton active />
    }

    return <div
        key={data.key ?? data._id}
        id={data._id}
        className={classnames(
            "postCard",
            data.type,
            { ["liked"]: hasLiked },
            { ["noHide"]: !expansibleActions },
            { ["fullmode"]: fullmode },
        )}
    >
        <div className="wrapper">
            <PostHeader
                postData={data}
                isLiked={hasLiked}
                likes={likes.length}
                comments={comments.length}
                fullmode={fullmode}
                onDoubleClick={onDoubleClick}
            />
            <PostContent
                data={data}
                autoCarrousel={autoCarrousel}
                fullmode={fullmode}
                onDoubleClick={onDoubleClick}
            />
        </div>
        {!fullmode &&
            <div className="actionsIndicatorWrapper">
                <div className="actionsIndicator">
                    <Icons.MoreHorizontal />
                </div>
            </div>
        }
        {!fullmode &&
            <div className="actionsWrapper">
                <PostActions
                    isSelf={selfId === data.user_id}
                    defaultLiked={hasLiked}
                    defaultSaved={hasSaved}
                    onClickLike={onClickLike}
                    onClickSave={onClickSave}
                    actions={{
                        delete: onClickDelete,
                    }}
                    fullmode={fullmode}
                />
            </div>
        }
    </div>
})

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

export default PostCard
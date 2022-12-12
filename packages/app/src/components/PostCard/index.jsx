import React from "react"
import * as antd from "antd"
import classnames from "classnames"

import { Icons } from "components/Icons"

import PostHeader from "./components/header"
import PostContent from "./components/content"
import PostActions from "./components/actions"
import PostAttachments from "./components/attachments"

import "./index.less"

export default ({
    expansibleActions = window.app.settings.get("postCard_expansible_actions"),
    autoCarrousel = window.app.settings.get("postCard_carrusel_auto"),
    data = {},
    events = {},
    fullmode
}) => {
    const isSelf = app.permissions.checkUserIdIsSelf(data.user_id)

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

    const onClickOpen = async () => {
        if (typeof events.onClickOpen !== "function") {
            console.warn("onClickOpen event is not a function, performing default action")
            return window.app.goToPost(data._id)
        }

        return await events.onClickOpen(data)
    }

    const onClickEdit = async () => {
        if (typeof events.onClickEdit !== "function") {
            console.warn("onClickEdit event is not a function")
            return
        }

        return await events.onClickEdit(data)
    }

    const onDataUpdate = (data) => {
        console.log("onDataUpdate", data)

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

        app.eventBus.on(`post.${data._id}.delete`, onClickDelete)
        app.eventBus.on(`post.${data._id}.update`, onClickEdit)

        // first listen to post changes
        window.app.api.namespaces["main"].listenEvent(`post.dataUpdate.${data._id}`, onDataUpdate)

        // then load
        setLoading(false)

        return () => {
            if (fullmode) {
                app.eventBus.emit("style.compactMode", false)
            }

            app.eventBus.off(`post.${data._id}.delete`, onClickDelete)
            app.eventBus.off(`post.${data._id}.update`, onClickEdit)

            // remove the listener
            window.app.api.namespaces["main"].unlistenEvent(`post.dataUpdate.${data._id}`, onDataUpdate)
        }
    }, [])

    React.useEffect(() => {
        if (!app.userData) {
            return
        }

        // check if the post has liked by you
        const hasLiked = likes.includes(app.userData._id)
        const hasSaved = data.isSaved

        setHasLiked(hasLiked)
        setHasSaved(hasSaved)
    })

    if (loading) {
        return <antd.Skeleton active />
    }

    try {
        return <div
            key={data.key ?? data._id}
            id={data._id}
            className={classnames(
                "postCard",
                data.type,
                { ["liked"]: hasLiked },
                { ["noHide"]: window.isMobile || !expansibleActions },
                { ["fullmode"]: fullmode },
            )}
            context-menu={"postCard-context"}
            user-id={data.user_id}
            self-post={isSelf.toString()}
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
                    nsfw={data.flags && data.flags.includes("nsfw")}
                >
                    {data.attachments && data.attachments.length > 0 && <PostAttachments
                        attachments={data.attachments}
                    />}
                </PostContent>
            </div>
            {!fullmode &&
                <div className="post_actionsIndicator">
                    <Icons.MoreHorizontal />
                </div>
            }
            {!fullmode &&
                <PostActions
                    defaultLiked={hasLiked}
                    defaultSaved={hasSaved}
                    onClickLike={onClickLike}
                    onClickSave={onClickSave}
                    onClickOpen={onClickOpen}
                    actions={{
                        delete: onClickDelete,
                    }}
                    fullmode={fullmode}
                />
            }
        </div>
    } catch (error) {
        console.error(error)

        return <div className="postCard error">
            <h1>
                <Icons.AlertTriangle />
                <span>Cannot render this post</span>
                <span>
                    Maybe this version of the app is outdated or is not supported yet
                </span>
            </h1>
        </div>
    }
}
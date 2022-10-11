import React from "react"
import * as antd from "antd"
import classnames from "classnames"

import { Icons } from "components/Icons"

import PostHeader from "./components/header"
import PostContent from "./components/content"
import PostActions from "./components/actions"

import "./index.less"

export default React.memo(({
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

    const onClickOpen = async () => {
        if (typeof events.onClickOpen !== "function") {
            console.warn("onClickOpen event is not a function, performing default action")
            return window.app.goToPost(data._id)
        }

        return await events.onClickOpen(data)
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

        // first listen to post changes
        window.app.api.namespaces["main"].listenEvent(`post.dataUpdate.${data._id}`, onDataUpdate)

        // then load
        setLoading(false)

        return () => {
            if (fullmode) {
                app.eventBus.emit("style.compactMode", false)
            }

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
            <div className="post_actionsIndicator">
                <Icons.MoreHorizontal />
            </div>
        }
        {!fullmode &&
            <PostActions
                isSelf={selfId === data.user_id}
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
})
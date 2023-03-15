import React from "react"
import * as antd from "antd"
import classnames from "classnames"
import moment from "moment"

import { Icons } from "components/Icons"
import { CommentCreator } from "components"

import PostModel from "models/post"

import "./index.less"

const CommentCard = (props) => {
    const { data, onClickDelete, self = false } = props

    const handleClickDelete = () => {
        if (typeof onClickDelete !== "function") {
            console.warn("onClickDelete is not a function")
            return
        }

        return onClickDelete(data._id)
    }

    return <div className="comment" id={data._id}>
        <div className="header">
            <div className="avatar">
                <antd.Avatar src={data.user.avatar} />
            </div>
            <div className="username">
                {data.user.username}
            </div>
            <div className="timeAgo">
                {moment(data.created_at).fromNow()}
            </div>
            {
                self && <antd.Button
                    className="deleteBtn"
                    type="link"
                    icon={<Icons.Trash />}
                    onClick={handleClickDelete}
                />
            }
        </div>
        <div className="content">
            {data.message}
        </div>
    </div>
}

export default (props) => {
    const [visible, setVisible] = React.useState(props.visible ?? true)
    const [comments, setComments] = React.useState(null)

    const fetchData = async () => {
        // fetch comments
        const commentsResult = await PostModel.getPostComments({
            post_id: props.post_id
        })
            .catch((err) => {
                console.log(err)

                antd.message.error("Failed to fetch comments")

                return null
            })

        if (!commentsResult) return

        setComments(commentsResult)
    }

    const handleCommentSubmit = async (comment) => {
        const result = await PostModel.sendComment({
            post_id: props.post_id,
            comment
        }).catch((err) => {
            console.log(err)

            antd.message.error("Failed to send comment")

            return null
        })

        if (!result) return
    }

    const handleCommentDelete = async (comment_id) => {
        antd.Modal.confirm({
            title: "Are you sure you want to delete this comment?",
            onOk: async () => {
                const result = await PostModel.deleteComment({
                    post_id: props.post_id,
                    comment_id: comment_id
                }).catch((err) => {
                    console.log(err)

                    antd.message.error("Failed to delete comment")
                })

                if (!result) return
            },
        })
    }

    const listenEvents = () => {
        app.cores.api.listenEvent(`post.new.comment.${props.post_id}`, (comment) => {
            setComments((comments) => {
                return [comment, ...comments]
            })
        })

        app.cores.api.listenEvent(`post.delete.comment.${props.post_id}`, (comment_id) => {
            setComments((comments) => {
                return comments.filter((comment) => comment._id !== comment_id)
            })
        })
    }

    const unlistenEvents = () => {
        app.cores.api.unlistenEvent(`post.new.comment.${props.post_id}`)
        app.cores.api.unlistenEvent(`post.delete.comment.${props.post_id}`)
    }

    React.useEffect(() => {
        setVisible(props.visible)
    }, [props.visible])

    React.useEffect(() => {
        if (visible) {
            fetchData()
            listenEvents()
        } else {
            unlistenEvents()
        }
    }, [visible])

    React.useEffect(() => {
        return () => {
            unlistenEvents()
        }
    }, [])

    const renderComments = () => {
        if (!comments) {
            return <antd.Skeleton />
        }

        if (comments.length === 0) {
            return <antd.Empty />
        }

        return <>
            {
                comments.map((comment) => {
                    return <CommentCard
                        data={comment}
                        onClickDelete={handleCommentDelete}
                        self={app.cores.permissions.checkUserIdIsSelf(comment.user._id)}
                    />
                })
            }
            <antd.Result
                status="info"
                title="This is the end"
                subTitle="There are no more comments"
            />
        </>
    }

    return <div
        id="comments"
        className={classnames(
            "comments",
            {
                "hidden": !visible
            }
        )}
    >
        <CommentCreator
            onSubmit={handleCommentSubmit}
            maxLength={PostModel.maxCommentLength}
        />

        {
            renderComments()
        }
    </div>
}
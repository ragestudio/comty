import React from "react"
import * as antd from "antd"
import moment from "moment"

import { Icons } from "components/Icons"
import { CommentCreator } from "components"

import "./index.less"

export default (props) => {
    const [postData, setPostData] = React.useState(null)
    const [comments, setComments] = React.useState(null)

    const fetchData = async () => {
        setPostData(null)
        setComments(null)

        // fetch post data
        const postDataResult = await window.app.api.request("main", "get", `post`, undefined, {
            post_id: props.post_id
        }).catch((err) => {
            console.log(err)

            antd.message.error("Failed to fetch post data")

            return null
        })

        if (!postDataResult) return

        setPostData(postDataResult)

        // fetch comments
        const commentsResult = await window.app.api.customRequest("main", {
            method: "get",
            url: `/post/${props.post_id}/comments`,
        }).catch((err) => {
            console.log(err)

            antd.message.error("Failed to fetch comments")

            return null
        })

        console.log(commentsResult)

        if (!commentsResult) return

        setComments(commentsResult.data)
    }

    React.useEffect(() => {
        fetchData()
    }, [])

    const renderComments = () => {
        if (!comments) {
            return <antd.Skeleton active />
        }

        if (comments.length === 0) {
            return <antd.Empty />
        }

        return comments.map((comment) => {
            return <div className="comment" id={comment._id}>
                <div className="header">
                    <div className="avatar">
                        <antd.Avatar src={comment.user.avatar} />
                    </div>
                    <div className="username">
                        {comment.user.username}
                    </div>
                    <div className="timeAgo">
                        {moment(comment.createdAt).fromNow()}
                    </div>
                </div>
                <div className="content">
                    {comment.message}
                </div>
            </div>
        })
    }

    if (!comments) {
        return <antd.Skeleton active />
    }

    return <div className="comments">
        <div className="header">
            <h1>
               <Icons.MessageSquare /> Comments
            </h1>
        </div>
        {renderComments()}
        <div className="commentCreatorWrapper">
            <CommentCreator />
        </div>
    </div>
}
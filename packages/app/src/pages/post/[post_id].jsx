import React from "react"
import * as antd from "antd"

import Post from "models/post"
import { PostCard, CommentsCard } from "components"

import "./index.less"

export default (props) => {
    const post_id = props.params.post_id

    const [data, setData] = React.useState(null)

    const loadData = async () => {
        setData(null)

        const data = await Post.getPost({ post_id }).catch(() => {
            antd.message.error("Failed to get post")

            return false
        })

        if (data) {
            setData(data)
        }
    }

    React.useEffect(() => {
        loadData()
    }, [])

    if (!data) {
        return <antd.Skeleton active />
    }

    return <div className="postPage">
        <div className="postWrapper">
            <PostCard data={data} fullmode />
        </div>
        <div className="commentsWrapper">
            <CommentsCard post_id={data._id} />
        </div>
    </div>
}
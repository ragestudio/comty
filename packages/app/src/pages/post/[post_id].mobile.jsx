import React from "react"
import * as antd from "antd"

import PostCard from "@components/PostCard"

import Post from "@models/post"

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
        app.layout.toggleCenteredContent(false)

        loadData()
    }, [])

    if (!data) {
        return <antd.Skeleton active />
    }

    return <div className="postPage">
        <PostCard data={data} fullmode />
    </div>
}
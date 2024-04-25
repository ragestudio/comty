import React from "react"
import * as antd from "antd"
import { FloatingPanel } from "antd-mobile"

import PostCard from "@components/PostCard"
import CommentsCard from "@components/CommentsCard"

import Post from "@models/post"

import "./index.less"

const floatingPanelAnchors = [160, 72 + 119, window.innerHeight * 0.8]

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

        <FloatingPanel anchors={floatingPanelAnchors}>
            <CommentsCard post_id={post_id} />
        </FloatingPanel>
    </div>
}
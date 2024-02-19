import React from "react"
import * as antd from "antd"

import PostService from "models/post"
import { PostCard, PostsList } from "components"

import "./index.less"

export default (props) => {
    const post_id = props.params.post_id

    const [data, setData] = React.useState(null)

    const loadData = async () => {
        setData(null)

        const data = await PostService.getPost({ post_id }).catch(() => {
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

    return <div className="post_view_wrapper">
        <div className="post_view_header">
            <h1>
                Post
            </h1>
        </div>

        <div className="post_view_content">
            <PostCard data={data} fullmode />

            <div className="post_view_content_replies">
<<<<<<< HEAD
                <PostsList
                    loadFromModel={PostService.getReplies}
                    loadFromModelProps={{ post_id }}
                />
=======
               <PostsList 
                    loadFromModel={PostService.getReplies}
                    loadFromModelProps={{ post_id }}
               />
>>>>>>> 7949bb9eca984e4628fd0ea93c11fe358053ed56
            </div>
        </div>
    </div>
}
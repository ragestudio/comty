import React from "react"
import * as antd from "antd"

import PostCard from "components/PostCard"
import PostsList from "components/PostsList"

import PostService from "models/post"

import "./index.less"

export default (props) => {
    const post_id = props.params.post_id

    const [loading, result, error, repeat] = app.cores.api.useRequest(PostService.getPost, {
        post_id,
    })

    if (error) {
        return <antd.Result
            status="warning"
            title="Failed to retrieve post"
            subTitle={error.message}
        />
    }

    if (loading) {
        return <antd.Skeleton active />
    }

    return <div className="post-page">
        <div className="post-page-original">
            <h1>Post</h1>

            <PostCard
                data={result}
            />
        </div>

        <div className="post-page-replies">
            <h1>Replies</h1>
            <PostsList
                disableReplyTag
                loadFromModel={PostService.replies}
                loadFromModelProps={{
                    post_id,
                }}
            />
        </div>
    </div>
}
import React from "react"
import * as antd from "antd"

import { Icons } from "@components/Icons"

import PostCard from "@components/PostCard"
import PostsList from "@components/PostsList"

import PostService from "@models/post"

import useCenteredContainer from "@hooks/useCenteredContainer"

import "./index.less"

const PostPage = (props) => {
    const post_id = props.params.post_id

    useCenteredContainer(true)

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
            <h1>
                <Icons.MdTextSnippet />
                Post
            </h1>

            <PostCard
                data={result}
                disableHasReplies
            />
        </div>

        {
            !!result.hasReplies && <div className="post-page-replies">
                <h1><Icons.FiRepeat />Replies</h1>

                <PostsList
                    disableReplyTag
                    loadFromModel={PostService.replies}
                    loadFromModelProps={{
                        post_id,
                    }}
                />
            </div>
        }
    </div>
}

export default PostPage
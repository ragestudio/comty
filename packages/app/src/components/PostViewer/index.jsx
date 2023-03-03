import React from "react"
import { PostCard, CommentsCard } from "components"

import "./index.less"

export default (props) => {
    const { post } = props

    return <div className="post_viewer">
        <PostCard
            data={post}
        />
    </div>
}
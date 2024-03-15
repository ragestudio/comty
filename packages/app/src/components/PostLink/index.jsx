import React from "react"
import { Tag } from "antd"

import "./index.less"

const PostLink = (props) => {
    if (!props.post_id) {
        return null
    }

    return <Tag
        className="post-link"
        color="geekblue"
        onClick={() => {
            if (props.onClick) {
                return props.onClick()
            }

            app.navigation.goToPost(props.post_id)
        }}
    >
        <span>
            #{props.post_id}
        </span>
    </Tag>
}

export default PostLink
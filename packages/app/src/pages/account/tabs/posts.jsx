import React from "react"
import { Result } from "antd"

import PostModel from "models/post"

import { PostsList } from "components"
import { Icons } from "components/Icons"

const emptyListRender = () => {
    return <Result
        icon={<Icons.UserX style={{ fontSize: "50px" }} />}
    >
        <h2>
            It's seems this user has no public post, yet.
        </h2>
    </Result>
}

export default class UserPosts extends React.Component {
    render() {
        return <PostsList
            onTopVisibility={this.props.onTopVisibility}
            emptyListRender={emptyListRender}
            loadFromModel={PostModel.getUserPosts}
            loadFromModelProps={{
                user_id: this.props.state.user._id,
            }}
        />
    }
}
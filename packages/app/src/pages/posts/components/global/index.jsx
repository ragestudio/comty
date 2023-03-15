import React from "react"

import { PostsList } from "components"

import Post from "models/post"

import "./index.less"

export default class ExplorePosts extends React.Component {
    render() {
        return <PostsList
            loadFromModel={Post.getExplorePosts}
            watchTimeline={[
                "post.new",
                "post.delete",
                "feed.new",
                "feed.delete",
            ]}
            realtime
        />
    }
}
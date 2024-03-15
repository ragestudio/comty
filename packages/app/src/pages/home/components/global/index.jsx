import React from "react"

import { PostsList } from "components"

import Feed from "models/feed"

import "./index.less"

export default class ExplorePosts extends React.Component {
    render() {
        return <PostsList
            loadFromModel={Feed.getGlobalTimelineFeed}
            watchTimeline={[
                "post.new",
                "post.delete",
                "feed.new",
            ]}
            realtime
        />
    }
}
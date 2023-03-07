import React from "react"

import { PostsList } from "components"

import FeedModel from "models/feed"

import "./index.less"

const emptyListRender = () => {
    return <div className="emptyFeed">
        <h2>
            We don't have any posts to show you.
        </h2>

        <p>
            Search for new people to follow on <a onClick={() => app.setLocation("/home/explore")}>explore</a> tab, to start view their posts.
        </p>
    </div>
}

export class Feed extends React.Component {
    render() {
        return <PostsList
            emptyListRender={emptyListRender}
            loadFromModel={FeedModel.getPostsFeed}
            onLoadMore={FeedModel.getPostsFeed}
            watchTimeline={[
                "feed.new",
                "post.delete",
            ]}
        />
    }
}

export default React.forwardRef((props, ref) => {
    return <Feed {...props} innerRef={ref} />
})
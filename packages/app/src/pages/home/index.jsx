import React from "react"
import { PostCreator, PostsFeed } from "components"

import "./index.less"

export default class PostsExplorer extends React.Component {
    render() {
        return <div className="explore">
            <div className="header">
                <PostCreator />
            </div>
            <PostsFeed />
        </div>
    }
}
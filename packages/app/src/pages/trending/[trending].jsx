import React from "react"

import PostList from "@components/PostsList"
import PostModel from "@models/post"

import "./index.less"

const TrendingPage = (props) => {
    const { trending } = props.params

    return <div className="trending-page">
        <div className="trending-page-header">
            <h1>#{trending.toLowerCase()}</h1>
        </div>

        <div className="trending-page-content">
            <PostList
                loadFromModel={PostModel.getTrending}
                loadFromModelProps={{
                    trending,
                }}
            />
        </div>
    </div>
}

export default TrendingPage
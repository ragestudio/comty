import React from "react"

import PostsList from "@components/PostsList"

import PostModel from "@models/post"

import "./index.less"

const emptyListRender = () => {
    return <div className="emptyFeed">
        <h2>
            You dont have any saved posts.
        </h2>
    </div>
}

export class SavedPosts extends React.Component {
    render() {
        return <PostsList
            loadFromModel={PostModel.getSavedPosts}
            emptyListRender={emptyListRender}
            realtime={false}
        />
    }
}

export default React.forwardRef((props, ref) => {
    return <SavedPosts {...props} innerRef={ref} />
})
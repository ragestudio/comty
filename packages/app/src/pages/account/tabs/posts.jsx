import React from "react"

import { PostsFeed } from "components"

export default React.memo((props) => {
    return <div className="posts">
        <PostsFeed
            fromUserId={props.state.user._id}
        />
    </div>
})
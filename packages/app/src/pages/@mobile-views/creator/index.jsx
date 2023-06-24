import React from "react"
import PostCreator from "components/PostCreator"

import "./index.less"

export default (props) => {
    const onPostDone = () => {
        if (typeof props.close === "function") {
            props.close()
        }
    }

    return <div className="_mobile_creator">
        <PostCreator
            onPost={onPostDone}
        />
    </div>
}
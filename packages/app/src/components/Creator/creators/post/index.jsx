import React from "react"

import { PostCreator } from "components"

export default (props) => {
    const handleOnPost = () => {
        if (typeof props.close === "function") {
            return props.close()
        } else {
            console.error("No close function provided")
        }
    }

    return <div className="content">
        <PostCreator onPost={handleOnPost} />
    </div>
}

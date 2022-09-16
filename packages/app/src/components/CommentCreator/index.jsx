import React from "react"
import * as antd from "antd"

import "./index.less"

export default (props) => {
    return <div className="commentCreator">
        <antd.Input.TextArea
            placeholder="Write a comment..."
            autoSize={{ minRows: 2, maxRows: 5 }}
        />
    </div>
}
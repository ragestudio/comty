import React from "react"
import classnames from "classnames"

import "./index.less"

export default (props) => {
    return <a
        onClick={props.onClick}
        className={classnames(
            "followButton",
            { ["followed"]: props.followed }
        )}>
        <span>{props.followed ? "Following" : "Follow"}</span>
    </a>
}

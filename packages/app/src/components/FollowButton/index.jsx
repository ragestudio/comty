import React from "react"
import classnames from "classnames"

import "./index.less"

export default (props) => {
    return <div className="followButton">
        <div className="counter">
            {props.count}
        </div>
        <div
            onClick={props.onClick}
            className={classnames(
                "btn",
                { ["followed"]: props.followed }
            )}>
            <span>{props.followed ? "Following" : "Follow"}</span>
        </div>
    </div>
}

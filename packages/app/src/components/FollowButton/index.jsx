import React from "react"
import { Button } from "antd"
import classnames from "classnames"

import "./index.less"

export default (props) => {
    return <div className="followButton">
        <div className="counter">
            {props.count}
        </div>
        {
            !props.self && <Button
                type="ghost"
                onClick={props.onClick}
                className={classnames(
                    "btn",
                    { ["followed"]: props.followed }
                )}
            >
                <span>{props.followed ? "Following" : "Follow"}</span>
            </Button>
        }
    </div>
}

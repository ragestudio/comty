import React from "react"
import classnames from "classnames"
import "./index.less"

export default (props) => {
    const { children } = props

    return <div style={props.style} className={classnames("actionsBar_card", [props.mode])}>
        <div style={props.wrapperStyle} className="actionsBar_flexWrapper">
            {children}
        </div>
    </div>
}
import React from "react"
import classnames from "classnames"
import "./index.less"

export default (props) => {
    const { children, float } = props

    return <div style={props.style} className={classnames("actionsBar_card", { ["float"]: float })}>
        <div style={props.wrapperStyle} className="actionsBar_flexWrapper">
            {children}
        </div>
    </div>
}
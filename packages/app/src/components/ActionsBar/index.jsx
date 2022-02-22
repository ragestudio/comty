import React from "react"
import classnames from "classnames"
import "./index.less"

export default (props) => {
    const { children } = props

    return <div
        style={{
            ...props.style,
            padding: props.padding,
        }}
        className={classnames(
            "actionsBar", 
            [props.mode],
            {["transparent"]: props.type === "transparent"},
            {["spaced"]: props.spaced},
        )}
    >
        <div
            style={props.wrapperStyle}
            className="wrapper"
        >
            {children}
        </div>
    </div>
}
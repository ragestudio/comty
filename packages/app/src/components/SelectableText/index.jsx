import React from "react"

import "./index.less"

const SelectableText = (props) => {
    return <p className="selectable-text">
        {props.children}
    </p>
}

export default SelectableText
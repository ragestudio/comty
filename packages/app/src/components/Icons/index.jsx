import React from "react"

import VrChatIcon from "./customIcons/vrchat"
import VerifiedBadge from "./customIcons/verifiedBadge"

// import icons lib
import * as lib1 from "feather-reactjs"
import * as lib2 from "@ant-design/icons"
import * as lib3 from "react-icons/md"
import * as lib4 from "react-icons/io"
import * as lib5 from "react-icons/si"
import * as lib6 from "react-icons/fa"

const marginedStyle = {
    width: "1em",
    height: "1em",
    marginRight: "10px",
    verticalAlign: "-0.125em"
}

const customs = {
    verifiedBadge: () => <VerifiedBadge
        style={marginedStyle}
    />,
    VrChat: () => <VrChatIcon
        style={marginedStyle}
    />,
}

export const Icons = {
    ...customs,
    ...lib1,
    ...lib2,
    ...lib3,
    ...lib4,
    ...lib5,
    ...lib6,
}

export function createIconRender(icon, props) {
    if (typeof Icons[icon] !== "undefined") {
        return React.createElement(Icons[icon], props)
    }

    return null
}

export default Icons
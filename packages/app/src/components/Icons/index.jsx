import React from "react"

// import icons lib
import * as lib1 from "feather-reactjs"
import * as lib2 from "react-icons/md"
import * as lib3 from "@ant-design/icons"
import * as lib4 from "react-icons/si"

const marginedStyle = { width: "1em", height: "1em", marginRight: "10px", verticalAlign: "-0.125em" }

const customs = {
    verifiedBadge: () => <svg style={marginedStyle} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24"> <path d="M23 12l-2.44-2.78.34-3.68-3.61-.82-1.89-3.18L12 3 8.6 1.54 6.71 4.72l-3.61.81.34 3.68L1 12l2.44 2.78-.34 3.69 3.61.82 1.89 3.18L12 21l3.4 1.46 1.89-3.18 3.61-.82-.34-3.68L23 12m-13 5l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"></path></svg>,
}

export const Icons = {
    ...customs,
    ...lib1,
    ...lib2,
    ...lib3,
    ...lib4,
}

export function createIconRender(icon, props) {
    if (typeof Icons[icon] !== "undefined") {
        return React.createElement(Icons[icon], props)
    }

    return null
}

export default Icons
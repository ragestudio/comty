import React from "react"
import classnames from "classnames"
import * as antd from "antd"

import { Drawer, Sidedrawer } from "components/layout"

export default (props) => {
    return <antd.Layout className="app_layout" style={{ height: "100%" }}>
        <Drawer />
        <Sidedrawer />
        {React.cloneElement(props.children, props)}
    </antd.Layout>
}
import React from "react"
import * as antd from "antd"

import { Drawer, Sidedrawer } from "components/Layout"

export default (props) => {
    return <antd.Layout className="app_layout" style={{ height: "100%" }}>
        <Drawer />
        <Sidedrawer />
        <div id="transitionLayer" className="fade-transverse-active">
            {React.cloneElement(props.children, props)}
        </div>
    </antd.Layout>
}

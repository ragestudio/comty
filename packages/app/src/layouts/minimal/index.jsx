import React from "react"
import * as antd from "antd"
import classnames from "classnames"
import { DraggableDrawerController } from "@layouts/components/draggableDrawer"

import Drawer from "@layouts/components/drawer"

export default (props) => {
    return <antd.Layout className={classnames("app_layout")} style={{ height: "100%" }}>
        <Drawer />
        <DraggableDrawerController />

        <div id="transitionLayer" className="fade-transverse-active">
            {React.cloneElement(props.children, props)}
        </div>
    </antd.Layout>
}

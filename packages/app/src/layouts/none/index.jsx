import React from "react"
import * as antd from "antd"
import classnames from "classnames"

import { Drawer, Sidedrawer } from "components/Layout"

export default (props) => {
    return <antd.Layout className={classnames("app_layout", { ["mobile"]: app.isMobile })} style={{ height: "100%" }}>
        <Drawer />
        <Sidedrawer />
        <div id="transitionLayer" className="fade-transverse-active">
            {React.cloneElement(props.children, props)}
        </div>
    </antd.Layout>
}

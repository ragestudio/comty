import React from "react"
import classnames from "classnames"
import * as antd from "antd"

import { Sidebar, Drawer, Sidedrawer } from "components/layout"

export default (props) => {
    return <antd.Layout className="app_layout" style={{ height: "100%" }}>
        <Drawer />
        <Sidebar user={props.user} />
        <Sidedrawer />
        <antd.Layout className="content_layout">
            <antd.Layout.Content className={classnames("layout_page", ...props.layoutPageModesClassnames ?? [])}>
                <div id="transitionLayer" className="fade-transverse-active">
                    {React.cloneElement(props.children, props)}
                </div>
            </antd.Layout.Content>
        </antd.Layout>
    </antd.Layout>
}
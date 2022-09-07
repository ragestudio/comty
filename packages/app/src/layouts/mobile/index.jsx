import React from "react"
import classnames from "classnames"
import * as antd from "antd"

import { Drawer, BottomBar } from "components/layout"

export default (props) => {
    return <antd.Layout className={classnames("app_layout", ["mobile"])} style={{ height: "100%" }}>
        <antd.Layout className="content_layout">
            <antd.Layout.Content className={classnames("layout_page", ...props.layoutPageModesClassnames ?? [])}>
                <div id="transitionLayer" className="fade-transverse-active">
                    {React.cloneElement(props.children, props)}
                </div>
            </antd.Layout.Content>
        </antd.Layout>
        <BottomBar user={props.user} />
        <Drawer />
    </antd.Layout>
}
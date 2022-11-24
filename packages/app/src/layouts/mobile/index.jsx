import React from "react"
import classnames from "classnames"
import * as antd from "antd"

import { BottomBar, Drawer, Sidedrawer, Modal } from "components/Layout"

export default (props) => {
    return <antd.Layout className={classnames("app_layout", ["mobile"])} style={{ height: "100%" }}>
        <Modal />

        <antd.Layout.Content className={classnames("content_layout", ...props.layoutPageModesClassnames ?? [])}>
            <div className={classnames("frameDecorator", "top")} />
            <div id="transitionLayer" className={classnames("content_wrapper", "fade-transverse-active")}>
                {React.cloneElement(props.children, props)}
            </div>
            <div className={classnames("frameDecorator", "bottom")} />
        </antd.Layout.Content>

        <BottomBar />
        <Sidedrawer />
        <Drawer />
    </antd.Layout>
}

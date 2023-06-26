import React from "react"
import classnames from "classnames"
import * as antd from "antd"

import { BottomBar, Drawer, Sidedrawer, Modal } from "components/Layout"

export default (props) => {
    return <antd.Layout id="app_layout" className={classnames("app_layout", ["mobile"])}>
        <Modal />

        <antd.Layout.Content className={classnames("content_layout", ...props.layoutPageModesClassnames ?? [])}>
            <div id="transitionLayer" className={classnames("content_wrapper", "fade-transverse-active")}>
                {React.cloneElement(props.children, props)}
            </div>
        </antd.Layout.Content>

        <BottomBar />
        <Sidedrawer />
        <Drawer />
    </antd.Layout>
}

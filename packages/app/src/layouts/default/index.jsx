import React from "react"
import classnames from "classnames"
import { Layout } from "antd"

import { Sidebar, Drawer, Sidedrawer, Modal } from "components/layout"

export default (props) => {
    return <>
        <div className="app_background_decorator" />
        <Layout className="app_layout" style={{ height: "100%" }}>
            <Modal />
            <Drawer />
            <Sidebar user={props.user} />
            <Sidedrawer />
            <Layout className="content_layout">
                <Layout.Content className={classnames("layout_page", ...props.layoutPageModesClassnames ?? [])}>
                    <div id="transitionLayer" className="fade-transverse-active">
                        {React.cloneElement(props.children, props)}
                    </div>
                </Layout.Content>
            </Layout>
        </Layout>
    </>
}
import React from "react"
import classnames from "classnames"
import { Layout } from "antd"

import { Sidebar, Drawer, Sidedrawer, Modal } from "components/Layout"

export default (props) => {
    return <>
        <div className="app_background_decorator" />
        <Layout className="app_layout" style={{ height: "100%" }}>
            <Modal />
            <Drawer />
            <Sidebar user={props.user} />
            <Sidedrawer />
            <Layout.Content className={
                classnames(
                    "content_layout",
                    ...props.contentClassnames ?? [],
                    {
                        ["floating-sidebar"]: window.app?.settings.get("sidebar.floating")
                    }
                )}>
                <div id="transitionLayer" className="fade-transverse-active">
                    {React.cloneElement(props.children, props)}
                </div>
            </Layout.Content>
        </Layout>
    </>
}
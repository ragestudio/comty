import React from "react"
import classnames from "classnames"
import { Layout } from "antd"

import { Sidebar, Drawer, Sidedrawer, Modal } from "components/Layout"

import BackgroundDecorator from "components/BackgroundDecorator"

import { createWithDom as FloatingStack } from "../components/floatingStack"

export default (props) => {
    React.useEffect(() => {
        const floatingStack = FloatingStack()

        return () => {
            floatingStack.remove()
        }
    }, [])

    return <>
        <BackgroundDecorator />

        <Layout className="app_layout" style={{ height: "100%" }}>
            <Modal />
            <Drawer />
            <Sidebar />
            <Sidedrawer />
            <Layout.Content
                className={classnames(
                    "content_layout",
                    ...props.contentClassnames ?? [],
                    {
                        ["floating-sidebar"]: window.app?.cores.settings.get("sidebar.floating")
                    }
                )}
            >
                <div
                    id="transitionLayer"
                    className={classnames(
                        "page_layout",
                        "fade-transverse-active",
                    )}
                >
                    {React.cloneElement(props.children, props)}
                </div>
            </Layout.Content>
        </Layout>
    </>
}
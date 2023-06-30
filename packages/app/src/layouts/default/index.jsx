import React from "react"
import classnames from "classnames"
import { Layout } from "antd"

import { Sidebar, Drawer, Sidedrawer, Modal, BottomBar, TopBar, ToolsBar } from "components/Layout"

import BackgroundDecorator from "components/BackgroundDecorator"

import { createWithDom as FloatingStack } from "../components/floatingStack"

const DesktopLayout = (props) => {
    React.useEffect(() => {
        const floatingStack = FloatingStack()

        return () => {
            floatingStack.remove()
        }
    }, [])

    return <>
        <BackgroundDecorator />

        <Layout id="app_layout" className="app_layout">
            <Modal />
            <Drawer />
            <Sidebar />
            <Sidedrawer />
            <Layout.Content
                id="content_layout"
                className={classnames(
                    ...props.contentClassnames ?? [],
                    "content_layout",
                    {
                        ["floating-sidebar"]: window.app?.cores.settings.get("sidebar.floating")
                    },
                    "fade-transverse-active",
                )}
            >
                {
                    React.cloneElement(props.children, props)
                }
            </Layout.Content>
            <ToolsBar />
        </Layout>
    </>
}

const MobileLayout = (props) => {
    return <Layout id="app_layout" className="app_layout">
        <Modal />

        <TopBar />

        <Layout.Content
            id="content_layout"
            className={classnames(
                ...props.layoutPageModesClassnames ?? [],
                "content_layout",
                "fade-transverse-active",
            )}
        >
            {
                React.cloneElement(props.children, props)
            }
        </Layout.Content>

        <BottomBar />
        <Drawer />
    </Layout>
}

export default (props) => {
    return window.app.isMobile ? <MobileLayout {...props} /> : <DesktopLayout {...props} />
} 
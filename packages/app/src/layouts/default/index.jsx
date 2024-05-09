import React from "react"
import classnames from "classnames"
import { Layout } from "antd"

import Sidebar from "@layouts/components/sidebar"
import Drawer from "@layouts/components/drawer"
import Sidedrawer from "@layouts/components/sidedrawer"
import BottomBar from "@layouts/components/bottomBar"
import TopBar from "@layouts/components/topBar"
import ToolsBar from "@layouts/components/toolsBar"
import Header from "@layouts/components/header"
import InitializeModalsController from "@layouts/components/modals"

import BackgroundDecorator from "@components/BackgroundDecorator"

const DesktopLayout = (props) => {
    InitializeModalsController()

    return <>
        <BackgroundDecorator />

        <Layout id="app_layout" className="app_layout">
            <Drawer />
            <Sidebar />
            <Sidedrawer />

            <Layout.Content
                id="content_layout"
                className={classnames(
                    ...props.contentClassnames ?? [],
                    "content_layout",
                    "fade-transverse-active",
                )}
            >
                <Header />

                {
                    props.children && React.cloneElement(props.children, props)
                }
            </Layout.Content>
            <ToolsBar />
        </Layout>
    </>
}

const MobileLayout = (props) => {
    return <Layout id="app_layout" className="app_layout">
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
                props.children && React.cloneElement(props.children, props)
            }
        </Layout.Content>

        <BottomBar />
        <Drawer />
    </Layout>
}

export default (props) => {
    return window.app.isMobile ? <MobileLayout {...props} /> : <DesktopLayout {...props} />
} 
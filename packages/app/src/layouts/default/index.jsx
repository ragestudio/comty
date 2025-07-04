import React from "react"
import classnames from "classnames"
import { Layout } from "antd"

import Sidebar from "@layouts/components/sidebar"
import ToolsBar from "@layouts/components/toolsBar"
import Header from "@layouts/components/header"
import Modals from "@layouts/components/modals"

import BetaBanner from "@components/BetaBanner"

// mobile components
import { DraggableDrawerController } from "@layouts/components/draggableDrawer"
import BottomBar from "@layouts/components/@mobile/bottomBar"
import TopBar from "@layouts/components/@mobile/topBar"

import BackgroundDecorator from "@components/BackgroundDecorator"

const DesktopLayout = (props) => {
	return (
		<>
			<BackgroundDecorator />
			<Modals />
			<DraggableDrawerController />

			<Layout id="app_layout" className="app_layout">
				<Sidebar user={props.user} />

				<Layout.Content
					id="content_layout"
					className={classnames(
						...(props.contentClassnames ?? []),
						"content_layout",
						"fade-transverse-active",
					)}
				>
					<Header />

					{props.children &&
						React.cloneElement(props.children, props)}
				</Layout.Content>

				<ToolsBar />
			</Layout>

			<BetaBanner />
		</>
	)
}

const MobileLayout = (props) => {
	return (
		<Layout id="app_layout" className="app_layout">
			<DraggableDrawerController />
			<TopBar />

			<Layout.Content
				id="content_layout"
				className={classnames(
					...(props.layoutPageModesClassnames ?? []),
					"content_layout",
					"fade-transverse-active",
				)}
			>
				{props.children && React.cloneElement(props.children, props)}
			</Layout.Content>

			<BottomBar />
		</Layout>
	)
}

export default (props) => {
	return window.app.isMobile ? (
		<MobileLayout {...props} />
	) : (
		<DesktopLayout {...props} />
	)
}

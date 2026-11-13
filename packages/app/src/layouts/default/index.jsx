import React from "react"
import classnames from "classnames"
import { Layout } from "antd"
import { useLocation } from "react-router"

import Drawer from "@layouts/components/drawer"
import Sidebar from "@layouts/components/sidebar"
import ToolsBar from "@layouts/components/toolsBar"
import Header from "@layouts/components/header"
import Modals from "@layouts/components/modals"

import RTCWidgets from "@components/Spaces/RTCWidgets"

import { useSpacesRouteSync } from "@/stores/spaces/navigation"
import BetaBanner from "@components/BetaBanner"

// mobile components
import { DraggableDrawerController } from "@layouts/components/draggableDrawer"
import BottomBar from "@layouts/components/@mobile/bottomBar"
import TopBar from "@layouts/components/@mobile/topBar"

import BackgroundDecorator from "@components/BackgroundDecorator"

const DesktopLayout = (props) => {
	const location = useLocation()

	// keep the spaces navigation store in sync with the url app wide
	useSpacesRouteSync()

	React.useEffect(() => {
		app.eventBus.emit("layout:ready")
	}, [])

	return (
		<>
			<BackgroundDecorator />
			<Modals />
			<RTCWidgets />
			<DraggableDrawerController />
			<Drawer />

			<Layout
				id="app_layout"
				className="app_layout"
			>
				<Sidebar />

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

				{!location.pathname?.startsWith("/spaces") && <ToolsBar />}
			</Layout>

			<BetaBanner />
		</>
	)
}

const MobileLayout = (props) => {
	// keep the spaces navigation store in sync with the url app wide
	useSpacesRouteSync()
	React.useEffect(() => {
		app.eventBus.emit("layout:ready")
	}, [])

	return (
		<Layout
			id="app_layout"
			className="app_layout"
		>
			<DraggableDrawerController />
			<TopBar />
			<Modals />

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

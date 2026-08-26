import React from "react"
import classnames from "classnames"
import { Layout } from "antd"

import LoadIcon from "@ui/LoadIcon"
import BackgroundDecorator from "@components/BackgroundDecorator"
import Drawer from "@layouts/components/drawer"
import Modals from "@layouts/components/modals"
import Sidebar from "./sidebar"

// mobile components
import { DraggableDrawerController } from "@layouts/components/draggableDrawer"
import TopBar from "@layouts/components/@mobile/topBar"
import BottomBar from "@layouts/components/@mobile/bottomBar"
import OptInDialog from "../../components/Spaces/OptInDialog"

import { useSpacesNavigationStore } from "@comty/spaces-lib"

import "./index.less"

const useIsConnectedToMainSocket = () => {
	const [connected, setConnected] = React.useState(
		app.cores.api.socket()?.state.connected,
	)

	const events = {
		"wsmanager:main:open": () => setConnected(true),
		"wsmanager:main:reconnected": () => setConnected(true),
		"wsmanager:main:reconnecting": () => setConnected(false),
	}

	React.useEffect(() => {
		for (const [event, handler] of Object.entries(events)) {
			app.eventBus.on(event, handler)
		}

		return () => {
			for (const [event, handler] of Object.entries(events)) {
				app.eventBus.off(event, handler)
			}
		}
	}, [])

	return connected
}

const SpacesLayout = (props) => {
	const firstLoad = useSpacesNavigationStore((s) => s.firstLoad)
	const navActions = useSpacesNavigationStore((s) => s.actions)
	const isMainSocketConnected = useIsConnectedToMainSocket()

	React.useEffect(() => {
		app.layout.toggleRootContainerClassname("sidebar-expanded", false)
	}, [])

	React.useEffect(() => {
		navActions.initFromUrl()
		window.addEventListener("popstate", navActions.initFromUrl)

		return () =>
			window.removeEventListener("popstate", navActions.initFromUrl)
	}, [])

	React.useEffect(() => {
		if (app.userData) {
			if (
				!app.userData.flags ||
				!app.userData?.flags?.includes("spaces_preview")
			) {
				app.layout.modal.open("optin-dialog", OptInDialog)
			}
		}
	}, [])

	// React.useEffect(() => {
	// 	if (isMainSocketConnected) {
	// 		ChatsService.ack
	// 			.get()
	// 			.then((acks) => {
	// 				app.cores.notifications.state.acks = acks || []
	// 				app.eventBus.emit(
	// 					"acks:updated",
	// 					app.cores.notifications.state.acks,
	// 				)
	// 			})
	// 			.catch((e) => {
	// 				console.error("Failed to fetch ACKs", e)
	// 			})
	// 	}
	// }, [isMainSocketConnected])

	return (
		<>
			<BackgroundDecorator />
			<Modals />
			<DraggableDrawerController />
			<Drawer />
			{app.isMobile && <TopBar noTransition />}

			<Layout
				id="app_layout"
				className="app_layout"
			>
				{!app.isMobile && <Sidebar />}

				<Layout.Content
					id="content_layout"
					className={classnames(
						...(props.contentClassnames ?? []),
						"content_layout",
						"fade-transverse-active",
						"spaces-layout",
					)}
				>
					{!isMainSocketConnected && (
						<div className="socket-indicator">
							<LoadIcon />
							<span>Connecting to socket</span>
						</div>
					)}

					{!firstLoad &&
						props.children &&
						React.cloneElement(props.children, props)}
				</Layout.Content>

				{app.isMobile && <BottomBar />}
			</Layout>
		</>
	)
}

export default SpacesLayout

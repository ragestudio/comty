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

import {
	useSpacesNavigationController,
	SpacesNavigationContext,
} from "@contexts/WithSpaces/navigation"

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
	const controller = useSpacesNavigationController()
	const isMainSocketConnected = useIsConnectedToMainSocket()

	React.useEffect(() => {
		app.layout.toggleRootContainerClassname("sidebar-expanded", false)
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
				<SpacesNavigationContext.Provider value={controller}>
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

						{!controller.firstLoad &&
							props.children &&
							React.cloneElement(props.children, props)}
					</Layout.Content>

					{app.isMobile && <BottomBar />}
				</SpacesNavigationContext.Provider>
			</Layout>
		</>
	)
}

export default SpacesLayout

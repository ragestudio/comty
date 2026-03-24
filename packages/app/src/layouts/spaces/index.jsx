import React from "react"
import classnames from "classnames"
import { Layout } from "antd"

import BackgroundDecorator from "@components/BackgroundDecorator"
import Drawer from "@layouts/components/drawer"
import Modals from "@layouts/components/modals"
import Sidebar from "./sidebar"

// mobile components
import { DraggableDrawerController } from "@layouts/components/draggableDrawer"
import TopBar from "@layouts/components/@mobile/topBar"
import BottomBar from "@layouts/components/@mobile/bottomBar"

import {
	controller as SpacesPageController,
	context as SpacesPageContext,
} from "@contexts/WithSpaces/page"

const SpacesLayout = (props) => {
	const controller = SpacesPageController()

	React.useEffect(() => {
		app.layout.toggleRootContainerClassname("sidebar-expanded", false)
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
				<SpacesPageContext.Provider value={controller}>
					{!app.isMobile && <Sidebar />}

					<Layout.Content
						id="content_layout"
						className={classnames(
							...(props.contentClassnames ?? []),
							"content_layout",
							"fade-transverse-active",
						)}
					>
						<div
							className="spaces-page"
							style={{
								width: "100%",
							}}
						>
							{!controller.firstLoad &&
								props.children &&
								React.cloneElement(props.children, props)}
						</div>
					</Layout.Content>

					{app.isMobile && <BottomBar />}
				</SpacesPageContext.Provider>
			</Layout>
		</>
	)
}

export default SpacesLayout

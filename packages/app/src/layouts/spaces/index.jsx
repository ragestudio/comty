import React from "react"
import classnames from "classnames"
import { Layout } from "antd"

import BackgroundDecorator from "@components/BackgroundDecorator"
import Drawer from "@layouts/components/drawer"
import Modals from "@layouts/components/modals"
import Sidebar from "@components/Spaces/Sidebar"

// mobile components
import { DraggableDrawerController } from "@layouts/components/draggableDrawer"

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

			<Layout
				id="app_layout"
				className="app_layout"
			>
				<SpacesPageContext.Provider value={controller}>
					<Sidebar />

					<Layout.Content
						id="content_layout"
						className={classnames(
							...(props.contentClassnames ?? []),
							"content_layout",
							"fade-transverse-active",
						)}
					>
						<div className="spaces-page">
							{!controller.firstLoad &&
								props.children &&
								React.cloneElement(props.children, props)}
						</div>
					</Layout.Content>
				</SpacesPageContext.Provider>
			</Layout>
		</>
	)
}

export default SpacesLayout

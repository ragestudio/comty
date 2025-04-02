import React from "react"
import Image from "@components/Image"
import { Icons } from "@components/Icons"
import ErrorBoundary from "@components/ErrorBoundary"

import useCenteredContainer from "@hooks/useCenteredContainer"
import useTotalWindowHeight from "@hooks/useTotalWindowHeight"

import "./index.less"

const AppPage = (props) => {
	const { id } = props.params

	useCenteredContainer(false)
	useTotalWindowHeight(true)

	const [loading, setLoading] = React.useState(true)

	const [customApp, setCustomApp] = React.useState({})
	const [extensionRef, setExtensionRef] = React.useState({})
	const [Render, setRender] = React.useState(() => () => null)

	async function loadApp() {
		setLoading(true)

		const extension = app.extensions.extensions.get(id)

		if (!extension) {
			throw new Error(`Extension with id ${id} not found`)
		}

		if (typeof extension.main.app.onLoad === "function") {
			await extension.main.app.onLoad()
		}

		setExtensionRef(extension)
		setCustomApp(extension.main.app)
		setRender(extension.main.app.renderComponent)

		setLoading(false)
	}

	React.useEffect(() => {
		loadApp()
	}, [])

	if (loading) {
		return (
			<div className="custom-app-page-loading">
				<div className="custom-app-page-loading-icon">
					{customApp.icon && (
						<Image src={customApp.icon} alt={customApp.name} />
					)}
				</div>

				<Icons.LoadingOutlined
					spin
					className="custom-app-page-loader"
				/>
			</div>
		)
	}

	return (
		<div className="custom-app-page-render">
			<ErrorBoundary>
				<Render />
			</ErrorBoundary>
		</div>
	)
}

export default AppPage

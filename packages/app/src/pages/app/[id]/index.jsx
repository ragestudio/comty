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
	const [appMetadata, setAppMetadata] = React.useState({})
	const [ctx, setCtx] = React.useState({})
	const extensionRef = React.useRef(null)

	async function loadApp() {
		setLoading(true)

		const extension = app.extensions.extensions.get(id)

		if (!extension) {
			throw new Error(`Extension with id ${id} not found`)
		}

		if (!extension.main.app.component) {
			throw new Error(`Missing component for extension with id [${id}]`)
		}

		setAppMetadata({
			title: extension.main.app.title,
			description: extension.main.app.description,
			icon: extension.main.app.icon,
		})

		if (typeof extension.main.app.onLoad === "function") {
			await extension.main.app.onLoad()
		}

		if (typeof extension.main.app.component.onMount === "function") {
			await extension.main.app.component.onMount({
				extension,
				ctx,
				setCtx,
			})
		}

		// set to ref
		extensionRef.current = extension

		setLoading(false)
	}

	React.useEffect(() => {
		loadApp()
	}, [])

	if (loading) {
		return (
			<div className="custom-app-page-loading">
				<div className="custom-app-page-loading-icon">
					{appMetadata.icon && (
						<Image
							src={appMetadata.icon}
							alt={appMetadata.title}
						/>
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
				{React.createElement(extensionRef.current.main.app.component, {
					extension: extensionRef.current,
					ctx,
					setCtx,
				})}
			</ErrorBoundary>
		</div>
	)
}

AppPage.options = {
	layout: {
		maxHeight: true,
	},
}

export default AppPage

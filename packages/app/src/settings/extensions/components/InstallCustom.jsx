import React from "react"
import { Input, Alert, Button } from "antd"

const confirmInstall = async (url, data) => {
	return new Promise((resolve, reject) => {
		app.layout.modal.confirm({
			headerText: "Confirm Installation",
			descriptionText:
				"Check and verify the details of the extension before installing.",
			onConfirm: async () => {
				app.extensions
					.install(url)
					.then(() => {
						app.message.success("Extension installed successfully")
						resolve()
					})
					.catch((error) => {
						console.error("Error installing extension:", error)
						reject(error)
					})
			},
			onCancel: () => {
				resolve()
			},
			render: () => {
				return (
					<code
						style={{
							display: "flex",
							flexDirection: "column",
							gap: "8px",
							fontSize: "14px",
							backgroundColor: "var(--background-color-primary)",
							padding: "10px",
							borderRadius: "12px",
							overflow: "hidden",
							whiteSpace: "pre-wrap",
							wordBreak: "break-word",
						}}
					>
						<span>Name: {data.name}</span>
						<span>Version: {data.version}</span>
						<span>Description: {data.description}</span>
						<span>Author: {data.author}</span>
						<span>License: {data.license}</span>
						<span>Homepage: {data.homepage}</span>
					</code>
				)
			},
		})
	})
}

const InstallCustom = (props) => {
	const [url, setUrl] = React.useState("")
	const [error, setError] = React.useState("")
	const [installing, setInstalling] = React.useState(false)

	const handleInputChange = (event) => {
		setUrl(event.target.value)
	}

	const handleInstallClick = async () => {
		setError(null)
		setInstalling(true)

		if (!url) {
			setError("Please enter a valid URL")
			setInstalling(false)
			return false
		}

		let data = await fetch(url).catch((error) => {
			return null
		})

		if (
			!data ||
			data.status !== 200 ||
			!data.headers.get("content-type").includes("application/json")
		) {
			setError("Failed to fetch extension data")
			setInstalling(false)
			return false
		}

		try {
			data = await data.json()
		} catch (error) {
			setError("Failed to parse extension data")
			setInstalling(false)
			return false
		}

		await confirmInstall(url, data)

		setInstalling(false)

		if (props.close) {
			props.close()
		}
	}

	return (
		<div className="install-custom-extension">
			<div className="install-custom-extension-header">
				<h2>Install Custom Extension</h2>
				<p>
					Please enter the URL of the extension you want to install.
				</p>
			</div>

			<Input
				placeholder="https://example.com/extension/package.json"
				onChange={handleInputChange}
			/>
			<Button
				size="small"
				type="primary"
				onClick={handleInstallClick}
				disabled={installing}
				loading={installing}
			>
				Install
			</Button>

			{error && <Alert message={error} type="error" />}

			<Alert
				message="Be aware installing custom extensions may pose security risks. Only install extensions from trusted sources."
				type="warning"
			/>
		</div>
	)
}

export default InstallCustom

import React from "react"
import { Tag, Switch, Button } from "antd"
import { Icons } from "@components/Icons"
import Image from "@components/Image"

import ExtensionItem from "./components/ExtensionItem"
import InstallCustom from "./components/InstallCustom"

import "./index.less"

function getInstalledExtensions() {
	let extensions = []

	for (let extension of app.extensions.extensions.values()) {
		extensions.push(extension)
	}

	return extensions
}

const ExtensionsPage = () => {
	const [loading, setLoading] = React.useState(false)
	const [extensions, setExtensions] = React.useState([])

	const events = {
		"extension:installed": () => {
			setExtensions(getInstalledExtensions())
		},
		"extension:uninstalled": () => {
			setExtensions(getInstalledExtensions())
		},
	}

	const onSwitchEnable = (extension, checked) => {
		app.extensions.toggleExtension(extension.id, checked)
		return !checked
	}

	const onClickUninstall = (extension) => {
		app.layout.modal.confirm({
			headerText: "Uninstall Extension",
			descriptionText:
				"Are you sure you want to uninstall this extension?",
			onConfirm: async () => {
				await app.extensions.uninstall(extension.id)
				app.message.success("Extension uninstalled")
			},
		})
	}

	React.useEffect(() => {
		setLoading(true)
		setExtensions(getInstalledExtensions())
		setLoading(false)
	}, [])

	React.useEffect(() => {
		for (const event in events) {
			app.eventBus.on(event, events[event])
		}

		return () => {
			for (const event in events) {
				app.eventBus.off(event, events[event])
			}
		}
	}, [])

	return (
		<div className="extensions-page">
			<div className="extensions-page-header">
				<div className="extensions-page-header-text">
					<h1>Extensions</h1>
					<p>Manage your extensions here.</p>
				</div>
				<div className="extensions-page-header-actions">
					<Button
						type="primary"
						icon={<Icons.FiPlus />}
						onClick={() =>
							app.layout.modal.open(
								"install_custom",
								InstallCustom,
							)
						}
					/>
				</div>
			</div>

			<div className="extensions-list">
				{extensions.map((extension) => (
					<ExtensionItem
						key={extension.id}
						extension={extension}
						onSwitchEnable={onSwitchEnable}
						onClickUninstall={onClickUninstall}
					/>
				))}
			</div>
		</div>
	)
}

export default ExtensionsPage

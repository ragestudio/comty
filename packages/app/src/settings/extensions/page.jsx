import React from "react"
import { Button } from "antd"
import { Icons } from "@components/Icons"

import ExtensionItem from "./components/ExtensionItem"
import InstallCustom from "./components/InstallCustom"

import "./index.less"

const ExtensionsPage = () => {
	const [manifests, setManifests] = React.useState([])

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

	const onClickReload = (extension) => {
		app.extensions.loadById(extension.id)
	}

	const loadManifestList = async () => {
		setManifests(await app.extensions.db.manifest.getAll())
	}

	const events = {
		"extension:installed": () => {
			loadManifestList()
		},
		"extension:uninstalled": () => {
			loadManifestList()
		},
	}

	React.useEffect(() => {
		loadManifestList()
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
						icon={<Icons.Plus />}
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
				{manifests.map((manifest) => (
					<ExtensionItem
						key={manifest.id}
						manifest={manifest}
						onSwitchEnable={onSwitchEnable}
						onClickUninstall={onClickUninstall}
						onClickReload={onClickReload}
					/>
				))}
			</div>
		</div>
	)
}

export default ExtensionsPage

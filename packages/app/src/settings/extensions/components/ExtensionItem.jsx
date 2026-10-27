import React from "react"
import { Tag, Switch } from "antd"
import { Icons } from "@components/Icons"
import Image from "@components/Image"

import Button from "@/ui/Button"

const ExtensionItem = ({
	manifest,
	onClickUninstall,
	onSwitchEnable,
	onClickReload,
}) => {
	const extensionObj = app.extensions.get(manifest.id)

	return (
		<div
			key={manifest.id}
			className="extension-item"
		>
			{manifest.icon && (
				<div className="extension-item-icon">
					<Image
						src={manifest.icon}
						alt={manifest.name}
					/>
				</div>
			)}

			{!manifest.icon && (
				<div className="extension-item-icon">
					<Icons.Box />
				</div>
			)}

			<div className="extension-item-details">
				<p className="extension-item-name">
					{manifest.title ?? manifest.name}
				</p>
				<p className="extension-item-description">
					{manifest.description}
				</p>

				<div className="extension-item-indicators">
					<Tag>{manifest.id}</Tag>

					<Tag
						color="blue"
						icon={<Icons.Tag />}
					>
						v{manifest.version}
					</Tag>

					{extensionObj && extensionObj.loadDuration && (
						<Tag
							color="green"
							icon={<Icons.Clock />}
						>
							Load {extensionObj.loadDuration.toFixed(2)}ms
						</Tag>
					)}

					{!extensionObj && <Tag color="error">Not loaded</Tag>}

					{manifest.author && (
						<Tag icon={<Icons.User />}>{manifest.author}</Tag>
					)}
					{manifest.license && (
						<Tag icon={<Icons.Lock />}>{manifest.license}</Tag>
					)}

					{manifest.homepage && (
						<Tag icon={<Icons.ExternalLink />}>
							{manifest.homepage}
						</Tag>
					)}
				</div>
			</div>

			<div className="extension-item-actions">
				<Switch
					defaultChecked={manifest.enabled}
					onChange={(checked) => onSwitchEnable(manifest, checked)}
				/>

				<Button
					icon={<Icons.Trash />}
					onClick={() => onClickUninstall(manifest)}
				/>
				<Button
					icon={<Icons.RefreshCcw />}
					onClick={() => onClickReload(manifest)}
				/>
			</div>
		</div>
	)
}

export default ExtensionItem

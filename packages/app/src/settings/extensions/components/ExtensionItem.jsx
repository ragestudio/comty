import React from "react"
import { Tag, Switch, Button } from "antd"
import { Icons } from "@components/Icons"
import Image from "@components/Image"

const ExtensionItem = ({ extension, onClickUninstall, onSwitchEnable }) => {
	return (
		<div key={extension.id} className="extension-item">
			{extension.manifest.icon && (
				<div className="extension-item-icon">
					<Image
						src={extension.manifest.icon}
						alt={extension.manifest.name}
					/>
				</div>
			)}

			{!extension.manifest.icon && (
				<div className="extension-item-icon">
					<Icons.FiBox />
				</div>
			)}

			<div className="extension-item-details">
				<p className="extension-item-name">
					{extension.manifest.name} [{extension.id}]
				</p>
				<p className="extension-item-description">
					{extension.manifest.description}
				</p>
				<div className="extension-item-indicators">
					<Tag color="blue" icon={<Icons.FiTag />}>
						v{extension.manifest.version}
					</Tag>
					<Tag color="green" icon={<Icons.FiClock />}>
						Load {extension.loadDuration.toFixed(2)}ms
					</Tag>
					{extension.manifest.author && (
						<Tag icon={<Icons.FiUser />}>
							{extension.manifest.author}
						</Tag>
					)}
					{extension.manifest.license && (
						<Tag icon={<Icons.FiLock />}>
							{extension.manifest.license}
						</Tag>
					)}

					{extension.manifest.homepage && (
						<Tag icon={<Icons.FiExternalLink />}>
							{extension.manifest.homepage}
						</Tag>
					)}
				</div>
			</div>

			<div className="extension-item-actions">
				<Switch
					defaultChecked={extension.enabled}
					onChange={(checked) => onSwitchEnable(extension, checked)}
				/>

				<Button
					icon={<Icons.FiTrash />}
					onClick={() => onClickUninstall(extension)}
				/>
			</div>
		</div>
	)
}

export default ExtensionItem

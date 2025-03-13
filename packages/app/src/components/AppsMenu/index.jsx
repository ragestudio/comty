import React from "react"
import { Popover, Empty } from "antd"
import { FiInfo, FiBox, FiUser } from "react-icons/fi"

import RouterLink from "@components/RouterLink"
import Image from "@components/Image"

import "./index.less"

function fetchInstalledApps() {
	let apps = []

	for (let extension of app.extensions.extensions.values()) {
		if (extension.enabled == false || !extension.main) {
			continue
		}

		if (typeof extension.main.app === "object") {
			apps.push({
				...extension.main.app,
				...extension.manifest,
			})
		}
	}

	return apps
}

const AppInfo = ({ item }) => {
	return (
		<div className="apps-menu-item-info-extra">
			<span>
				<FiUser />
				{item.author}
			</span>
			<span>
				<FiBox /> v{item.version}
			</span>
		</div>
	)
}

const App = ({ item, close }) => {
	function onClick() {
		app.location.push(`/app/${item.id}`)
		close()
	}

	return (
		<div className="apps-menu-item" onClick={onClick}>
			<div className="apps-menu-item-icon">
				{item.icon && <Image src={item.icon} alt={item.title} />}
			</div>

			<div className="apps-menu-item-info">
				<div className="apps-menu-item-info-titles">
					<h3>{item.title}</h3>
					<span className="apps-menu-item-info-description">
						{item.description}
					</span>
				</div>

				<Popover
					content={<AppInfo item={item} />}
					classNames={{
						body: "apps-menu-item-info-extra",
					}}
				>
					<FiInfo />
				</Popover>
			</div>
		</div>
	)
}

const AppMenu = (props) => {
	const installedApps = React.useMemo(() => {
		return fetchInstalledApps()
	}, [])

	return (
		<div className="apps-menu">
			<h1>Apps</h1>

			{installedApps.map((item) => {
				return <App item={item} key={item.key} {...props} />
			})}

			{installedApps.length === 0 && (
				<Empty
					description="No apps installed"
					image={Empty.PRESENTED_IMAGE_SIMPLE}
				/>
			)}

			<p>
				Manage or install your apps from
				<RouterLink to="/settings?tab=extensions" onClick={props.close}>
					here
				</RouterLink>
			</p>
		</div>
	)
}

export default AppMenu

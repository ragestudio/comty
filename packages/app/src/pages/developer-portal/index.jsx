import React from "react"
import * as antd from "antd"
import { Icons } from "@components/Icons"
import OAuthTab from "./tabs/oauth"
import ApiTab from "./tabs/api"
//import BotsTab from "./tabs/bots"

import "./index.less"

const Tabs = {
	api: {
		key: "api",
		title: "API",
		icon: Icons.Cable,
		component: ApiTab,
	},
	oauth: {
		key: "oauth",
		title: "OAuth",
		component: OAuthTab,
		icon: Icons.SiOpenid,
	},
	//bots: BotsTab,
}

const TabsArr = Object.values(Tabs)

const DeveloperPortalPage = (props) => {
	const [activeTab, setActiveTab] = React.useState(null)
	const [tabLoaderData, setTabLoaderData] = React.useState(null)

	const onClickTab = async (key) => {
		setTabLoaderData(null)

		if (!Tabs[key]?.component) {
			return null
		}

		if (Tabs[key].component.loader) {
			setTabLoaderData(await Tabs[key].component.loader())
		}

		setActiveTab(key)
	}

	return (
		<div className="dev-portal">
			<div className="dev-portal__menu">
				<h2>Developer Portal</h2>

				<div className="card">
					<antd.Menu selectedKeys={activeTab}>
						{TabsArr.map((item) => {
							return (
								<antd.Menu.Item
									key={item.key}
									onClick={() => onClickTab(item.key)}
									icon={
										item.icon &&
										React.createElement(item.icon, {})
									}
								>
									<span>{item.title}</span>
								</antd.Menu.Item>
							)
						})}
					</antd.Menu>
				</div>

				<div className="card">
					<h3>Documentations</h3>

					<div className="links">
						<a>Comty CLI</a>
						<a>Comty.JS for NodeJS</a>
						<a>Comty Extensions SDK</a>
						<a>Spectrum API</a>
					</div>
				</div>
			</div>

			<div className="dev-portal__content">
				{TabsArr.map((item) => {
					if (item.key === activeTab) {
						return React.createElement(item.component, {
							loaderData: tabLoaderData ?? {},
						})
					}
					return null
				})}
			</div>
		</div>
	)
}

DeveloperPortalPage.options = {
	layout: {
		centeredContent: false,
	},
}

export default DeveloperPortalPage

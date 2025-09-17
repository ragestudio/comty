import React from "react"
import classnames from "classnames"
import { createIconRender } from "@components/Icons"

export const QuickNavMenuItems = [
	{
		id: "music",
		icon: "SquareLibrary",
		label: "Music",
		location: "/music",
	},
	{
		id: "tv",
		icon: "MonitorPlay",
		label: "Tv",
		location: "/tv",
	},
	{
		id: "spaces",
		icon: "MessageSquareQuote",
		label: "Spaces",
		location: "/groups",
		disabled: true,
	},
	{
		id: "marketplace",
		icon: "Grid2x2Plus",
		label: "Marketplace",
		location: "/marketplace",
		disabled: true,
	},
]

export const QuickNavMenu = ({ visible }) => {
	return (
		<div
			className={classnames("quick-nav", {
				["active"]: visible,
			})}
		>
			{QuickNavMenuItems.map((item, index) => {
				return (
					<div
						key={index}
						className={classnames("quick-nav_item", {
							["disabled"]: item.disabled,
						})}
						quicknav-item={item.id}
						disabled={item.disabled}
					>
						{createIconRender(item.icon)}
						<h1>{item.label}</h1>
					</div>
				)
			})}
		</div>
	)
}

export default QuickNavMenu

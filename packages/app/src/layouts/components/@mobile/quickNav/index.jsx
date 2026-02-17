import classnames from "classnames"
import { createIconRender } from "@components/Icons"

import "./index.less"

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
		location: "/spaces",
	},
]

export const QuickNavMenu = ({ visible }) => {
	return (
		<div
			className={classnames("quick-nav bg-accent", {
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

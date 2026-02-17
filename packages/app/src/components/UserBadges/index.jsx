import React from "react"
import { Tooltip } from "antd"
import DOMPurify from "dompurify"
import { createIconRender } from "@components/Icons"

import BadgesModel from "@models/badges"
import svgCss from "@utils/svgCss"

import "./index.less"

const Badge = ({ badge }) => {
	const [bgUrl, setBgUrl] = React.useState(null)

	async function load() {
		if (!badge.iconUrl) {
			return null
		}

		let data = await fetch(badge.iconUrl, {
			method: "GET",
			headers: {
				"Cache-Control": "no-cache",
			},
		})

		if (!data.ok) {
			console.warn("Badge: Failed to load the badge icon.", badge.iconUrl)
			return null
		}

		if (data.headers.get("content-type") === "image/svg+xml") {
			setBgUrl(
				svgCss(
					DOMPurify.sanitize(await data.text(), {
						USE_PROFILES: {
							svg: true,
						},
					}),
					{
						color: badge.color,
					},
				),
			)
		} else {
			setBgUrl(`url('${badge.iconUrl}')`)
		}
	}

	React.useEffect(() => {
		if (badge.iconUrl || !bgUrl) {
			load()
		}
	}, [badge])

	return (
		<Tooltip
			placement="bottom"
			title={badge.description ?? "A badge"}
		>
			<div
				className="user-badges__badge"
				style={{
					color: badge.color ?? "var(--text-color)",
					backgroundImage: bgUrl,
					filter: badge.filter,
					scale: badge.scale,
					backgroundColor: badge.backgroundColor,
					borderRadius: badge.borderRadius,
				}}
			>
				{!bgUrl && badge.icon && createIconRender(badge.icon)}
			</div>
		</Tooltip>
	)
}

const UserBadges = ({ badges }) => {
	if (!badges || !Array.isArray(badges)) {
		return null
	}

	if (badges.length > 2) {
		badges = badges.slice(0, 2)
	}

	const [items, setItems] = React.useState([])

	const load = React.useCallback(async () => {
		if (!badges) {
			return null
		}

		const data = await BadgesModel.data(badges).catch((err) => {
			return null
		})

		if (data) {
			setItems(data)
		}
	}, [badges])

	React.useEffect(() => {
		load()
	}, [])

	if (!items.length) {
		return null
	}

	return (
		<div className="user-badges">
			{items.map((badge, index) => {
				return (
					<Badge
						key={index}
						badge={badge}
					/>
				)
			})}
		</div>
	)
}

export default UserBadges

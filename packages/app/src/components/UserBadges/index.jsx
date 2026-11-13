import React from "react"
import { Tooltip } from "antd"
import DOMPurify from "dompurify"
import { createIconRender } from "@components/Icons"

import BadgesModel from "@endpoints/badges"
import svgCss from "@utils/svgCss"

import "./index.less"

export const Badge = ({ badge }) => {
	const [bgUrl, setBgUrl] = React.useState(null)

	const icon = badge.iconUrl ?? badge.icon

	const isUrlIcon =
		typeof icon === "string" && /^(https?:\/\/|data:|\/)/i.test(icon)

	async function load() {
		if (!isUrlIcon) {
			return null
		}

		let data = await fetch(icon, {
			method: "GET",
			headers: {
				"Cache-Control": "no-cache",
			},
		})

		if (!data.ok) {
			console.warn("Badge: Failed to load the badge icon.", icon)
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
			setBgUrl(`url('${icon}')`)
		}
	}

	React.useEffect(() => {
		setBgUrl(null)
		load()
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
				{!bgUrl && !isUrlIcon && icon && createIconRender(icon)}
			</div>
		</Tooltip>
	)
}

const UserBadges = ({ badges }) => {
	const normalizedBadges = React.useMemo(() => {
		if (!Array.isArray(badges)) return []

		return badges.slice(0, 2)
	}, [badges])

	const [items, setItems] = React.useState([])

	const load = React.useCallback(async () => {
		if (!normalizedBadges.length) {
			setItems([])
			return null
		}

		const data = await BadgesModel.data(normalizedBadges).catch(() => null)

		if (Array.isArray(data)) {
			setItems(data)
		}
	}, [normalizedBadges])

	React.useEffect(() => {
		load()
	}, [load])

	if (!normalizedBadges.length || !items.length) {
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

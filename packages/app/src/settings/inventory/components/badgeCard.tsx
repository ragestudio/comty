import { Tag } from "antd"

import { Badge as UserBadge } from "@/components/UserBadges"

import createBem from "@/utils/createBem"

import { getMeta } from "./utils"

import styles from "./badgeCard.module.less"

const card = createBem("inventory-badge-card", styles)

interface BadgeCardProps {
	entry: any
	order: number
}

export const BadgeCard = ({ entry, order }: BadgeCardProps) => {
	const item = entry.item
	const meta = getMeta(entry)

	return (
		<div className={card(null, { active: order >= 0 })}>
			<div className={card.elem("icon")}>
				<UserBadge badge={item} />
			</div>

			<div className={card.elem("info")}>
				<span className={card.elem("name")}>
					{item.label ?? item.name ?? String(item._id)}
				</span>

				{meta && <span className={card.elem("meta")}>{meta}</span>}
			</div>

			{order >= 0 && <Tag color="green">Displayed {order + 1}</Tag>}
		</div>
	)
}

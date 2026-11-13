import React from "react"
import { Tag } from "antd"

import Icons from "@/components/Icons"
import { getDecorationPreview, isVideoDecoration } from "@/utils/decoration"
import createBem from "@/utils/createBem"

import { getMeta } from "./utils"

import styles from "./decorationCard.module.less"

const card = createBem("inventory-card", styles)

interface DecorationCardProps {
	entry: any
	equipped: boolean
}

export const DecorationCard = ({ entry, equipped }: DecorationCardProps) => {
	const [forceVideo, setForceVideo] = React.useState(false)

	const item = entry.item
	const preview = getDecorationPreview(item)
	const isVideo = isVideoDecoration(item) || forceVideo
	const meta = getMeta(entry)

	return (
		<div className={card(null, { active: equipped })}>
			<div className={card.elem("preview")}>
				{preview ? (
					isVideo ? (
						<video
							src={preview}
							autoPlay
							loop
							muted
							playsInline
							preload="metadata"
						/>
					) : (
						<img
							src={preview}
							alt=""
							loading="lazy"
							onError={() => setForceVideo(true)}
						/>
					)
				) : (
					<Icons.Image />
				)}

				{equipped && (
					<Tag
						color="green"
						className={card.elem("tag")}
					>
						Equipped
					</Tag>
				)}
			</div>

			<div className={card.elem("info")}>
				<span className={card.elem("name")}>
					{item.name ?? item.label ?? String(item._id)}
				</span>

				{meta && <span className={card.elem("meta")}>{meta}</span>}
			</div>
		</div>
	)
}

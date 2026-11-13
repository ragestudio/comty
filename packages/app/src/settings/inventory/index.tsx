import type { SettingTabModule } from "@/pages/settings/types"

import React from "react"
import clsx from "clsx"
import { Button, Empty, Tabs, Tag } from "antd"

import { Icons } from "@components/Icons"
import { Badge as UserBadge } from "@components/UserBadges"

import { settingsStore } from "@/pages/settings/store"

import InventoryModel from "@endpoints/inventory"
import UserModel from "@endpoints/user"
import {
	getDecorationPreview,
	isKnownDecorationSlot,
	isVideoDecoration,
	resolveDecorationSlot,
} from "@/utils/decoration"

import "./index.less"

const DECORATION_SLOTS = [
	{ id: "user_card_bg", label: "Profile card", icon: Icons.PanelsTopLeft },
	{ id: "avatar_frame", label: "Avatar frame", icon: Icons.CircleUserRound },
	{ id: "member_bg", label: "Member background", icon: Icons.Wallpaper },
]

const SOURCE_LABELS: Record<string, string> = {
	admin: "Admin grant",
	system: "System grant",
	event: "Event reward",
	code: "Redeem code",
	migration: "Legacy",
}

const getSourceLabel = (source?: string) => {
	if (!source) return null

	return SOURCE_LABELS[source] ?? source
}

const formatDate = (value?: string | Date) => {
	if (!value) return null

	const date = value instanceof Date ? value : new Date(value)

	if (Number.isNaN(date.getTime())) return null

	return date.toLocaleDateString()
}

const getMeta = (entry) => {
	return [getSourceLabel(entry.source), formatDate(entry.granted_at)]
		.filter(Boolean)
		.join(" · ")
}

const DecorationCard = ({
	entry,
	equipped,
}: {
	entry: any
	equipped: boolean
}) => {
	const [forceVideo, setForceVideo] = React.useState(false)

	const item = entry.item
	const preview = getDecorationPreview(item)
	const isVideo = isVideoDecoration(item) || forceVideo
	const meta = getMeta(entry)

	return (
		<div
			className={clsx("inventory-card", {
				"inventory-card--active": equipped,
			})}
		>
			<div className="inventory-card__preview">
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
						className="inventory-card__tag"
					>
						Equipped
					</Tag>
				)}
			</div>

			<div className="inventory-card__info">
				<span className="inventory-card__name">
					{item.name ?? item.label ?? String(item._id)}
				</span>

				{meta && <span className="inventory-card__meta">{meta}</span>}
			</div>
		</div>
	)
}

const BadgeCard = ({ entry, order }: { entry: any; order: number }) => {
	const item = entry.item
	const meta = getMeta(entry)

	return (
		<div
			className={clsx("inventory-badge-card", {
				"inventory-badge-card--active": order >= 0,
			})}
		>
			<div className="inventory-badge-card__icon">
				<UserBadge badge={item} />
			</div>

			<div className="inventory-badge-card__info">
				<span className="inventory-badge-card__name">
					{item.label ?? item.name ?? String(item._id)}
				</span>

				{meta && (
					<span className="inventory-badge-card__meta">{meta}</span>
				)}
			</div>

			{order >= 0 && <Tag color="green">Displayed {order + 1}</Tag>}
		</div>
	)
}

const InventoryPage = ({ ctx }: { ctx: any }) => {
	const [inventory, setInventory] = React.useState<any[]>(
		ctx.inventory?.items ?? [],
	)

	const userData = ctx.userData ?? {}

	React.useEffect(() => {
		const handleInventoryUpdate = (next) => {
			if (Array.isArray(next?.items)) {
				setInventory(next.items)
			}
		}

		app.eventBus.on("inventory:update", handleInventoryUpdate)

		return () => {
			app.eventBus.off("inventory:update", handleInventoryUpdate)
		}
	}, [])

	const decorations = React.useMemo(() => {
		return inventory.filter(
			(entry) => entry.kind === "decoration" && entry.item,
		)
	}, [inventory])

	const badges = React.useMemo(() => {
		return inventory.filter((entry) => entry.kind === "badge" && entry.item)
	}, [inventory])

	const equippedDecorations = userData.decorations ?? {}
	const displayedBadges = userData.profile_badges ?? []
	const equippedIds = new Set(Object.values(equippedDecorations).map(String))

	const handleManageProfile = () => {
		settingsStore.getState().actions.navigate("profile", {
			transition: true,
			scroll: true,
		})
	}

	const renderDecorations = () => {
		if (!decorations.length) {
			return (
				<Empty
					image={Empty.PRESENTED_IMAGE_SIMPLE}
					description="You do not own any decorations yet"
				/>
			)
		}

		const otherDecorations = decorations.filter(
			(entry) =>
				!isKnownDecorationSlot(resolveDecorationSlot(entry.item)),
		)

		return (
			<>
				{DECORATION_SLOTS.map((slot) => {
					const items = decorations.filter(
						(entry) =>
							resolveDecorationSlot(entry.item) === slot.id,
					)

					if (!items.length) return null

					return (
						<section
							className="inventory-section"
							key={slot.id}
						>
							<div className="inventory-section__header">
								{React.createElement(slot.icon)}
								<h2>{slot.label}</h2>
								<span>{items.length}</span>
							</div>

							<div className="inventory-grid">
								{items.map((entry) => (
									<DecorationCard
										key={entry.item_id}
										entry={entry}
										equipped={equippedIds.has(
											String(entry.item_id),
										)}
									/>
								))}
							</div>
						</section>
					)
				})}

				{otherDecorations.length > 0 && (
					<section className="inventory-section">
						<div className="inventory-section__header">
							<Icons.Layers />
							<h2>Other</h2>
							<span>{otherDecorations.length}</span>
						</div>

						<div className="inventory-grid">
							{otherDecorations.map((entry) => (
								<DecorationCard
									key={entry.item_id}
									entry={entry}
									equipped={equippedIds.has(
										String(entry.item_id),
									)}
								/>
							))}
						</div>
					</section>
				)}
			</>
		)
	}

	const renderBadges = () => {
		if (!badges.length) {
			return (
				<Empty
					image={Empty.PRESENTED_IMAGE_SIMPLE}
					description="You do not own any badges yet"
				/>
			)
		}

		return (
			<div className="inventory-badges">
				{badges.map((entry) => (
					<BadgeCard
						key={entry.item_id}
						entry={entry}
						order={displayedBadges.indexOf(String(entry.item_id))}
					/>
				))}
			</div>
		)
	}

	return (
		<div className="inventory">
			<div className="inventory__header">
				<div className="inventory__heading">
					<h1>Inventory</h1>
					<p>
						{decorations.length} decorations · {badges.length}{" "}
						badges
					</p>
				</div>

				<Button
					icon={<Icons.UserPen />}
					onClick={handleManageProfile}
				>
					Manage profile
				</Button>
			</div>

			<Tabs
				defaultActiveKey={decorations.length ? "decorations" : "badges"}
				items={[
					{
						key: "decorations",
						label: `Decorations (${decorations.length})`,
						children: (
							<div className="inventory__content">
								{renderDecorations()}
							</div>
						),
					},
					{
						key: "badges",
						label: `Badges (${badges.length})`,
						children: (
							<div className="inventory__content">
								{renderBadges()}
							</div>
						),
					},
				]}
			/>
		</div>
	)
}

export default {
	id: "inventory",
	icon: "Backpack",
	label: "Inventory",
	group: "basic",
	ctxData: async () => {
		const [userData, inventory] = await Promise.all([
			UserModel.data().catch(() => null),
			InventoryModel.list().catch(() => ({ items: [] })),
		])

		return {
			userData,
			inventory,
		}
	},
	render: InventoryPage,
} satisfies SettingTabModule

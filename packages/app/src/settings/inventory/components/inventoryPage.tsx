import React from "react"
import { Button, Empty, Tabs } from "antd"

import { Icons } from "@components/Icons"
import {
	SettingsGroup,
	SettingsGroupHeader,
	SettingsSearchHeader,
} from "@/pages/settings/layout"
import { settingsStore } from "@/pages/settings/store"
import createBem from "@/utils/createBem"
import {
	isKnownDecorationSlot,
	resolveDecorationSlot,
} from "@/utils/decoration"

import { BadgeCard } from "./badgeCard"
import { DecorationCard } from "./decorationCard"
import { InventorySection } from "./inventorySection"
import { DECORATION_SLOTS } from "./utils"

import styles from "./inventoryPage.module.less"

const inventory = createBem("inventory", styles)

export const InventoryPage = ({ ctx }: { ctx: any }) => {
	const [inventoryItems, setInventoryItems] = React.useState<any[]>(
		ctx.inventory?.items ?? [],
	)

	const userData = ctx.userData ?? {}

	React.useEffect(() => {
		const handleInventoryUpdate = (next) => {
			if (Array.isArray(next?.items)) {
				setInventoryItems(next.items)
			}
		}

		app.eventBus.on("inventory:update", handleInventoryUpdate)

		return () => {
			app.eventBus.off("inventory:update", handleInventoryUpdate)
		}
	}, [])

	const decorations = React.useMemo(() => {
		return inventoryItems.filter(
			(entry) => entry.kind === "decoration" && entry.item,
		)
	}, [inventoryItems])

	const badges = React.useMemo(() => {
		return inventoryItems.filter(
			(entry) => entry.kind === "badge" && entry.item,
		)
	}, [inventoryItems])

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
						<InventorySection
							key={slot.id}
							title={slot.label}
							icon={React.createElement(slot.icon)}
							count={items.length}
						>
							<div className={inventory.elem("grid")}>
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
						</InventorySection>
					)
				})}

				{otherDecorations.length > 0 && (
					<InventorySection
						title="Other"
						icon={<Icons.Layers />}
						count={otherDecorations.length}
					>
						<div className={inventory.elem("grid")}>
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
					</InventorySection>
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
			<SettingsGroup>
				<div className={inventory.elem("badge-list")}>
					{badges.map((entry) => (
						<BadgeCard
							key={entry.item_id}
							entry={entry}
							order={displayedBadges.indexOf(
								String(entry.item_id),
							)}
						/>
					))}
				</div>
			</SettingsGroup>
		)
	}

	return (
		<div className={inventory()}>
			<SettingsGroupHeader>
				<Icons.Backpack />
				<h1>Inventory</h1>

				<div className={inventory.elem("header-actions")}>
					<span className={inventory.elem("count")}>
						{decorations.length} decorations · {badges.length}{" "}
						badges
					</span>

					<Button
						size="small"
						icon={<Icons.UserPen />}
						onClick={handleManageProfile}
					>
						Manage profile
					</Button>
				</div>
			</SettingsGroupHeader>

			<Tabs
				defaultActiveKey={decorations.length ? "decorations" : "badges"}
				items={[
					{
						key: "decorations",
						label: `Decorations (${decorations.length})`,
						children: (
							<div className={inventory.elem("tab")}>
								{renderDecorations()}
							</div>
						),
					},
					{
						key: "badges",
						label: `Badges (${badges.length})`,
						children: (
							<div className={inventory.elem("tab")}>
								{renderBadges()}
							</div>
						),
					},
				]}
			/>
		</div>
	)
}

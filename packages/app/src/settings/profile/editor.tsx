import type { User } from "@comty/shared/types/user"
import styles from "./editor.module.less"

import React from "react"
import classNames from "clsx"
import { Tabs } from "antd"

import createBem from "@/utils/createBem"
import useObjectUpdate from "@/hooks/useObjectUpdate"
import UserModel from "@endpoints/user"

import { GroupStore } from "@comty/spaces-sdk/group"
import { setUserDecorations } from "@comty/spaces-sdk/users"

import {
	BasicTab,
	DecorationsTab,
	EditorActions,
	ProfilePreview,
} from "./components"

const container = createBem("profile-editor", styles)
const content = container.sub("content")

const refreshSpacesDecorations = (
	userId: string,
	decorations: Record<string, any>,
) => {
	if (!userId) return

	setUserDecorations(userId, decorations)

	const groupState = GroupStore.getState()

	if (groupState.groupId) {
		void groupState.actions.evaluateDecorations([userId])
	}
}

export const ProfileEditor = (props) => {
	const initialUserData = props.ctx.processedCtx.userData as User
	const fallbackDecorations = props.ctx.processedCtx.decorations ?? {}
	const updatedUserData = useObjectUpdate<User>(initialUserData)

	const [inventory, setInventory] = React.useState<any[]>(
		props.ctx.processedCtx.inventory?.items ?? [],
	)

	React.useEffect(() => {
		const handleInventoryUpdate = (next) => {
			if (Array.isArray(next?.items)) {
				if (props.ctx.processedCtx) {
					props.ctx.processedCtx.inventory = next
				}

				setInventory(next.items)
			}
		}

		app.eventBus.on("inventory:update", handleInventoryUpdate)

		return () => {
			app.eventBus.off("inventory:update", handleInventoryUpdate)
		}
	}, [])

	const catalog = React.useMemo(() => {
		return inventory
			.filter((entry) => entry.kind === "decoration" && entry.item)
			.map((entry) => entry.item)
	}, [inventory])

	const badgeCatalog = React.useMemo(() => {
		return inventory
			.filter((entry) => entry.kind === "badge" && entry.item)
			.map((entry) => entry.item)
	}, [inventory])

	const selectedDecorations = (updatedUserData.current.decorations ??
		{}) as Record<string, string>

	const ownedSelected = React.useMemo(() => {
		const ownedIds = new Set(
			catalog.map((decoration) => String(decoration._id)),
		)

		return Object.fromEntries(
			Object.entries(selectedDecorations).filter(([, id]) =>
				ownedIds.has(String(id)),
			),
		)
	}, [catalog, selectedDecorations])

	const hydratedDecorations = React.useMemo(() => {
		if (!catalog.length) {
			return fallbackDecorations
		}

		const dict = Object.fromEntries(
			catalog.map((decoration) => [String(decoration._id), decoration]),
		)

		const result: Record<string, any> = {}

		for (const [slot, id] of Object.entries(ownedSelected)) {
			const decoration = dict[id]

			if (decoration) {
				result[slot] = decoration
			}
		}

		return result
	}, [catalog, ownedSelected, fallbackDecorations])

	const selectedBadges = (updatedUserData.current.profile_badges ??
		[]) as string[]

	const ownedSelectedBadges = React.useMemo(() => {
		const ownedIds = new Set(badgeCatalog.map((badge) => String(badge._id)))

		return selectedBadges.filter((id) => ownedIds.has(String(id)))
	}, [badgeCatalog, selectedBadges])

	const handleDecorationChange = (slot: string, id?: string) => {
		const next = { ...ownedSelected }

		if (id) {
			next[slot] = id
		} else {
			delete next[slot]
		}

		updatedUserData.updateProperty("decorations", next)
	}

	const handleBadgeChange = (index: number, id?: string) => {
		const next: Array<string | undefined> = [...ownedSelectedBadges]

		next[index] = id

		updatedUserData.updateProperty("profile_badges", next.filter(Boolean))
	}

	const handleSave = async () => {
		const changes = updatedUserData.getChanges()

		const { decorations, profile_badges, ...profileChanges } = changes

		try {
			let result = null

			if (Object.keys(profileChanges).length > 0) {
				result = await UserModel.updateData(profileChanges)
			}

			if (decorations) {
				await UserModel.decorations.update(decorations)
				refreshSpacesDecorations(
					initialUserData._id,
					hydratedDecorations,
				)
			}

			if (profile_badges) {
				await UserModel.badges.update(profile_badges)
			}

			updatedUserData.commit()
			props.ctx.dispatchUpdate(result ?? {})
		} catch (error: any) {
			app.message.error(error.response?.data?.error ?? error.message)
		}
	}

	return (
		<div className={classNames(container())}>
			<ProfilePreview
				user={updatedUserData.current}
				decorations={hydratedDecorations}
			/>

			<div className={content()}>
				<Tabs
					className={content.elem("tabs")}
					defaultActiveKey="basic"
					items={[
						{
							key: "basic",
							label: "Basic",
							children: (
								<div className={content.elem("tab-content")}>
									<BasicTab
										user={updatedUserData.current}
										updateProperty={
											updatedUserData.updateProperty
										}
									/>
								</div>
							),
						},
						{
							key: "decorations",
							label: "Decorations",
							children: (
								<div className={content.elem("tab-content")}>
									<DecorationsTab
										decorations={catalog}
										badges={badgeCatalog}
										selectedDecorations={ownedSelected}
										selectedBadges={ownedSelectedBadges}
										onDecorationChange={
											handleDecorationChange
										}
										onBadgeChange={handleBadgeChange}
									/>
								</div>
							),
						},
					]}
				/>

				<EditorActions
					hasChanges={updatedUserData.hasChanges}
					onRevert={updatedUserData.restore}
					onSave={handleSave}
				/>
			</div>
		</div>
	)
}

export default ProfileEditor

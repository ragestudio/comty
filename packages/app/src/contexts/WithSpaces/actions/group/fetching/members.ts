import type FetchingActions from "./index"

import GroupsModel from "@models/groups"

import { INITIAL_CACHE_PAGE_SIZE } from "../../../stores/group/constants"
import {
	cacheMembers,
	cacheTotalMembers,
	cacheUsers,
} from "../../../helpers/cache"

export default async function (this: FetchingActions): Promise<void> {
	if (!this.state.groupId) return

	const currentGeneration = this.state.initGeneration

	try {
		const response = await GroupsModel.members.list(this.state.groupId, {
			limit: INITIAL_CACHE_PAGE_SIZE,
		})
		if (currentGeneration !== this.state.initGeneration) return

		if (response?.items) {
			this.setState({ members: response })

			const users = response.items.map((m: any) => m.user).filter(Boolean)
			await cacheUsers(users)

			const bareMembers = response.items.map((m: any) => {
				const { user, ...rest } = m
				return rest
			})

			await cacheMembers(this.state.groupId, bareMembers)
			await cacheTotalMembers(this.state.groupId, response.total_items)

			this.state.actions.evaluateConnections(response.items)
			this.state.actions.evaluateDecorations(response.items)
		}
	} catch (err: any) {
		console.error("fetchMembers failed", err)
	}
}

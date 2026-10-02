import type FetchingActions from "./index"
import type { Group } from "@comty/shared/types/spaces/group"

import GroupsModel from "@models/groups"
import { cacheGroup } from "../../../helpers/cache"

export default async function (this: FetchingActions): Promise<Group | null> {
	if (!this.state.groupId) return null

	const currentGeneration = this.state.initGeneration

	try {
		const response = await GroupsModel.get(this.state.groupId)
		if (currentGeneration !== this.state.initGeneration) return null

		if (response) {
			this.setState({ data: response })
			await cacheGroup(response)
		}

		return response
	} catch (err: any) {
		console.error("fetchGroup failed", err)
		return null
	}
}

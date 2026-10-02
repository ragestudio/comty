import type LoadActions from "./index"

export default async function (this: LoadActions, id?: string): Promise<void> {
	const timeline = this.state.timeline
	const oldestId = timeline[0]?._id

	if (oldestId) {
		await this.state.actions.load({ beforeId: id ?? oldestId })
	}
}

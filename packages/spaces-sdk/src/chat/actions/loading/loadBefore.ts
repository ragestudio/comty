import type LoadActions from "./index"

export default async function (this: LoadActions, id?: string): Promise<void> {
	if (!this.state.hasMoreBefore) return

	const timeline = this.state.timeline
	const oldestId = timeline[timeline.length - 1]?._id

	if (oldestId) {
		await this.state.actions.load({ beforeId: id ?? oldestId })
	}
}

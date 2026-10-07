import type LoadActions from "./index"

export default async function (this: LoadActions, id?: string): Promise<void> {
	const timeline = this.state.timeline
	const newestId = timeline[timeline.length - 1]?._id

	if (newestId) {
		await this.state.actions.load({ afterId: id ?? newestId })
	}
}

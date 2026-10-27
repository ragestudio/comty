import type LoadActions from "./index"

export default async function (this: LoadActions, id?: string): Promise<void> {
	if (!this.state.hasMoreAfter) return

	const timeline = this.state.timeline
	const newestId = timeline[0]?._id

	if (newestId) {
		await this.state.actions.load({ afterId: id ?? newestId })
	}
}

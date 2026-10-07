import type LifecycleActions from "./index"

export default function (this: LifecycleActions, paused: boolean): void {
	this.setState({ pausedUpdates: paused })
}

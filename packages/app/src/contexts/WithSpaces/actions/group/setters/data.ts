import type SettersActions from "./index"

export default function (this: SettersActions, data: any): void {
	this.setState({ data })
}

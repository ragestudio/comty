import Model from "./model"

export class Result {
	constructor(data: any, model: Model) {
		Object.assign(this, data)

		Object.defineProperty(this, "$_model", {
			value: model,
			enumerable: false,
			writable: false,
		})
	}

	$_model: Model

	async save() {
		return this.$_model.update(this.toRaw())
	}

	async delete() {
		return this.$_model.delete(this.toRaw())
	}

	toRaw() {
		return { ...this }
	}
}

export default Result

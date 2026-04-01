import Model from "./model"

export class Result {
	constructor(data: any, model: Model) {
		if (data == null) {
			throw new Error("Cannot create Result with null or undefined data")
		}

		if (typeof data !== "object" || Array.isArray(data)) {
			throw new Error("Result data must be an object")
		}

		Object.assign(this, data)

		Object.defineProperty(this, "$_model", {
			value: model,
			enumerable: false,
			writable: false,
			configurable: false,
		})

		Object.freeze(this.$_model)
	}

	$_model: Model

	async save() {
		try {
			return await this.$_model._saveResult(this)
		} catch (error) {
			throw new Error(`Failed to save result: ${error.message}`)
		}
	}

	async delete() {
		try {
			return await this.$_model._deleteResult(this)
		} catch (error) {
			throw new Error(`Failed to delete result: ${error.message}`)
		}
	}

	toRaw() {
		const raw: Record<string, any> = {}

		for (const key in this) {
			if (key === "$_model") {
				continue
			}

			if (this.propertyIsEnumerable(key)) {
				const value = (this as any)[key]

				try {
					JSON.stringify(value)
					raw[key] = value
				} catch (error) {
					raw[key] = String(value)
				}
			}
		}

		return raw
	}

	isValid(): boolean {
		try {
			this.$_model._typeCheck(this.toRaw())
			return true
		} catch {
			return false
		}
	}

	getChangedFields(original: Record<string, any>): string[] {
		const current = this.toRaw()
		const changed: string[] = []

		for (const key in current) {
			if (!(key in original) || current[key] !== original[key]) {
				changed.push(key)
			}
		}

		return changed
	}
}

export default Result

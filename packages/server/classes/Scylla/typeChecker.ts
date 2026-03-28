import { types } from "cassandra-driver/lib/types"

export default function (this: any, data: any) {
	for (let [key, value] of Object.entries(data)) {
		const fieldDeclarationType = this.description.fields[key]

		const colErrStrPrefix = `[${this.name}] Column [${key}]`

		if (!fieldDeclarationType || value === undefined || value === null) {
			continue
		}

		switch (fieldDeclarationType) {
			case "varchar":
			case "text":
			case "ascii":
				if (typeof value !== "string") {
					throw new TypeError(`${colErrStrPrefix} must be a string`)
				}

				break
			case "int":
			case "double":
			case "float":
				if (typeof value !== "number") {
					throw new TypeError(`${colErrStrPrefix} must be a number`)
				}

				break
			case "boolean":
				if (typeof value !== "boolean") {
					throw new TypeError(`${colErrStrPrefix} must be a boolean`)
				}

				break
			case "uuid":
			case "timeuuid":
				if (
					!(value instanceof types.Uuid) &&
					typeof value !== "string"
				) {
					throw new TypeError(
						`${colErrStrPrefix} must be UUID or a valid String`,
					)
				}

				break
			case "timestamp":
				if (!(value instanceof Date)) {
					throw new TypeError(`${colErrStrPrefix} must be a Date`)
				}

				break
			case "list":
			case "set":
			case "tuple":
				if (!Array.isArray(value)) {
					throw new TypeError(`${colErrStrPrefix} must be a Array`)
				}
				break
		}
	}
}

import { types } from "cassandra-driver/lib/types"

const MAX_VARCHAR_LENGTH = 65535

export default function (this: any, data: any) {
	for (let [key, value] of Object.entries(data)) {
		const fieldDeclaration = this.description.fields[key]
		const fieldType =
			typeof fieldDeclaration === "object"
				? fieldDeclaration.type
				: fieldDeclaration

		const colErrStrPrefix = `[${this.name}] Column [${key}]`

		if (!fieldType || value === undefined || value === null) {
			continue
		}

		switch (fieldType) {
			case "varchar":
				if (typeof value !== "string") {
					throw new TypeError(`${colErrStrPrefix} must be a string`)
				}
				if (value.length > MAX_VARCHAR_LENGTH) {
					throw new RangeError(
						`${colErrStrPrefix} exceeds maximum length of ${MAX_VARCHAR_LENGTH} characters`,
					)
				}
				break
			case "text":
			case "ascii":
				if (typeof value !== "string") {
					throw new TypeError(`${colErrStrPrefix} must be a string`)
				}
				break
			case "int":
				if (typeof value !== "number" || !Number.isInteger(value)) {
					throw new TypeError(`${colErrStrPrefix} must be an integer`)
				}
				if (value < -2147483648 || value > 2147483647) {
					throw new RangeError(
						`${colErrStrPrefix} must be between -2147483648 and 2147483647`,
					)
				}
				break
			case "bigint":
			case "counter":
				if (typeof value !== "number" || !Number.isInteger(value)) {
					throw new TypeError(`${colErrStrPrefix} must be an integer`)
				}
				break
			case "double":
			case "float":
				if (typeof value !== "number") {
					throw new TypeError(`${colErrStrPrefix} must be a number`)
				}
				if (!Number.isFinite(value)) {
					throw new RangeError(
						`${colErrStrPrefix} must be a finite number`,
					)
				}
				break
			case "decimal":
			case "varint":
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
				if (typeof value === "string") {
					const uuidRegex =
						/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
					if (!uuidRegex.test(value)) {
						throw new TypeError(
							`${colErrStrPrefix} must be a valid UUID string`,
						)
					}
				}
				break
			case "timestamp":
				if (!(value instanceof Date)) {
					throw new TypeError(`${colErrStrPrefix} must be a Date`)
				}
				if (isNaN(value.getTime())) {
					throw new RangeError(
						`${colErrStrPrefix} must be a valid Date`,
					)
				}
				break
			case "blob":
				if (
					!(value instanceof Buffer) &&
					!(value instanceof Uint8Array)
				) {
					throw new TypeError(
						`${colErrStrPrefix} must be a Buffer or Uint8Array`,
					)
				}
				break
			case "list":
			case "set":
				if (!Array.isArray(value)) {
					throw new TypeError(`${colErrStrPrefix} must be an Array`)
				}
				// validate element types if specified
				const elementType =
					typeof fieldDeclaration === "object"
						? fieldDeclaration.elementType
						: null
				if (elementType && value.length > 0) {
					for (let i = 0; i < value.length; i++) {
						this._validateElementType(
							value[i],
							elementType,
							`${colErrStrPrefix}[${i}]`,
						)
					}
				}
				break
			case "tuple":
				if (!Array.isArray(value)) {
					throw new TypeError(`${colErrStrPrefix} must be an Array`)
				}
				// validate tuple element types if specified
				const tupleTypes =
					typeof fieldDeclaration === "object"
						? fieldDeclaration.tupleTypes
						: null
				if (tupleTypes && Array.isArray(tupleTypes)) {
					if (value.length !== tupleTypes.length) {
						throw new TypeError(
							`${colErrStrPrefix} must have exactly ${tupleTypes.length} elements`,
						)
					}
					for (let i = 0; i < value.length; i++) {
						this._validateElementType(
							value[i],
							tupleTypes[i],
							`${colErrStrPrefix}[${i}]`,
						)
					}
				}
				break
			case "map":
				if (
					typeof value !== "object" ||
					value === null ||
					Array.isArray(value)
				) {
					throw new TypeError(`${colErrStrPrefix} must be an object`)
				}
				// validate map key/value types if specified
				const keyType =
					typeof fieldDeclaration === "object"
						? fieldDeclaration.keyType
						: null
				const valueType =
					typeof fieldDeclaration === "object"
						? fieldDeclaration.valueType
						: null
				if (keyType || valueType) {
					for (const [mapKey, mapValue] of Object.entries(value)) {
						if (keyType) {
							this._validateElementType(
								mapKey,
								keyType,
								`${colErrStrPrefix} key`,
							)
						}
						if (valueType) {
							this._validateElementType(
								mapValue,
								valueType,
								`${colErrStrPrefix} value for key "${mapKey}"`,
							)
						}
					}
				}
				break
			default:
				throw new TypeError(
					`${colErrStrPrefix} has unsupported type: ${fieldType}`,
				)
		}
	}
}

// helper method for validating collection element types
function _validateElementType(
	this: any,
	value: any,
	expectedType: string,
	errorPrefix: string,
) {
	switch (expectedType) {
		case "varchar":
		case "text":
		case "ascii":
			if (typeof value !== "string") {
				throw new TypeError(`${errorPrefix} must be a string`)
			}
			break
		case "int":
			if (typeof value !== "number" || !Number.isInteger(value)) {
				throw new TypeError(`${errorPrefix} must be an integer`)
			}
			break
		case "double":
		case "float":
			if (typeof value !== "number") {
				throw new TypeError(`${errorPrefix} must be a number`)
			}
			break
		case "boolean":
			if (typeof value !== "boolean") {
				throw new TypeError(`${errorPrefix} must be a boolean`)
			}
			break
		case "uuid":
		case "timeuuid":
			if (typeof value !== "string") {
				throw new TypeError(`${errorPrefix} must be a string`)
			}
			break
		default:
			// for complex types, we'll accept them as-is
			break
	}
}

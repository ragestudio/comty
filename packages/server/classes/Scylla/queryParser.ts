import Model from "./model"

// @ts-ignore
import cassandra from "cassandra-driver"
const { q } = cassandra.mapping

const MAX_QUERY_DEPTH = 3
const MAX_IN_ELEMENTS = 1000

export default function (this: Model, query: any, depth: number = 0) {
	if (depth > MAX_QUERY_DEPTH) {
		throw new Error(`Query depth exceeds maximum of ${MAX_QUERY_DEPTH}`)
	}

	if (!query || typeof query !== "object") {
		return query
	}

	const queryKeys = Object.keys(query)
	const parsedQuery: Record<string, any> = {}

	for (const field of queryKeys) {
		const value = query[field]

		if (!this._isValidFieldName(field)) {
			throw new Error(`Invalid field name: ${field}`)
		}

		if (
			value !== null &&
			typeof value === "object" &&
			!Array.isArray(value) &&
			!(value instanceof Date)
		) {
			const operators = Object.keys(value)

			if (operators.length > 1) {
				throw new Error(
					`Multiple operators not allowed for field: ${field}`,
				)
			}

			const operator = operators[0]
			let opValue = value[operator]

			if (!this._isValidOperator(operator)) {
				throw new Error(`Invalid operator: ${operator}`)
			}

			switch (operator) {
				case "$in":
					if (!Array.isArray(opValue)) {
						throw new Error(`$in operator requires an array`)
					}
					if (opValue.length > MAX_IN_ELEMENTS) {
						throw new Error(
							`$in operator exceeds maximum of ${MAX_IN_ELEMENTS} elements`,
						)
					}
					opValue = opValue.map((val, index) => {
						if (val === null || val === undefined) {
							throw new Error(
								`$in array element at index ${index} cannot be null or undefined`,
							)
						}
						return val
					})
					parsedQuery[field] = q.in_(opValue)
					break
				case "$gt":
				case "$gte":
				case "$lt":
				case "$lte":
					if (opValue === null || opValue === undefined) {
						throw new Error(
							`${operator} operator cannot compare with null or undefined`,
						)
					}
					parsedQuery[field] =
						operator === "$gt"
							? q.gt(opValue)
							: operator === "$gte"
								? q.gte(opValue)
								: operator === "$lt"
									? q.lt(opValue)
									: q.lte(opValue)
					break
				case "$eq":
					parsedQuery[field] = opValue
					break
				case "$ne":
					if (opValue === null || opValue === undefined) {
						throw new Error(
							`$ne operator cannot compare with null or undefined`,
						)
					}
					parsedQuery[field] = q.notEq(opValue)
					break
				case "$and":
				case "$or":
					if (!Array.isArray(opValue)) {
						throw new Error(
							`${operator} operator requires an array`,
						)
					}
					if (opValue.length > 10) {
						throw new Error(
							`${operator} operator exceeds maximum of 10 conditions`,
						)
					}
					const parsedConditions = opValue.map((condition, index) => {
						if (!condition || typeof condition !== "object") {
							throw new Error(
								`${operator} condition at index ${index} must be an object`,
							)
						}
						return this._queryParser(condition, depth + 1)
					})
					parsedQuery[field] =
						operator === "$and"
							? q.and(...parsedConditions)
							: q.or(...parsedConditions)
					break
				default:
					throw new Error(`Operator [${operator}] not supported`)
			}
		} else if (Array.isArray(value)) {
			throw new Error(
				`Array values require explicit operator (e.g., $in) for field: ${field}`,
			)
		} else {
			parsedQuery[field] = value
		}
	}

	return parsedQuery
}

function _isValidFieldName(this: Model, fieldName: string): boolean {
	const invalidPatterns = [
		/^[0-9]/,
		/[^a-zA-Z0-9_]/,
		/^(select|insert|update|delete|drop|create|alter|truncate)$/i,
	]

	const fieldExists = fieldName in this.description.fields

	return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(fieldName) && fieldExists
}

function _isValidOperator(operator: string): boolean {
	const validOperators = [
		"$eq",
		"$ne",
		"$gt",
		"$gte",
		"$lt",
		"$lte",
		"$in",
		"$and",
		"$or",
	]
	return validOperators.includes(operator)
}

function _validateElementType(
	this: Model,
	value: any,
	expectedType: string,
): boolean {
	if (expectedType === "varchar") {
		return typeof value === "string"
	} else if (expectedType === "int") {
		return Number.isInteger(value)
	} else if (expectedType === "boolean") {
		return typeof value === "boolean"
	} else if (expectedType === "double") {
		return typeof value === "number"
	} else if (expectedType === "timestamp") {
		return value instanceof Date
	}
	return false
}

export { _isValidFieldName, _isValidOperator, _validateElementType }

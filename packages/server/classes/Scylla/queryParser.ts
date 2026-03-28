import Model from "./model"

// @ts-ignore
import cassandra from "cassandra-driver"
const { q } = cassandra.mapping

export default function (this: Model, query: any) {
	if (!query || typeof query !== "object") {
		return query
	}

	const parsedQuery = {}

	for (const [field, value] of Object.entries(query)) {
		if (
			value !== null &&
			typeof value === "object" &&
			!Array.isArray(value) &&
			!(value instanceof Date)
		) {
			const operators = Object.keys(value)
			const operator = operators[0]
			const opValue = value[operator]

			switch (operator) {
				case "$in":
					parsedQuery[field] = q.in_(opValue)
					break
				case "$gt":
					parsedQuery[field] = q.gt(opValue)
					break
				case "$gte":
					parsedQuery[field] = q.gte(opValue)
					break
				case "$lt":
					parsedQuery[field] = q.lt(opValue)
					break
				case "$lte":
					parsedQuery[field] = q.lte(opValue)
					break
				case "$eq":
					parsedQuery[field] = opValue
					break
				default:
					throw new Error(`Operator [${operator}] not supported`)
			}
		} else {
			parsedQuery[field] = value
		}
	}

	return parsedQuery
}

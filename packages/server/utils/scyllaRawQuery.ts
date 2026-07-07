import type { Model } from "@ragestudio/scylla-odm"

type RawQueryOptions = {
	limit?: number
	orderBy?: Record<string, "ASC" | "DESC">
	raw?: boolean
}

/**
 * Execute a raw CQL query using the scylla-odm client.
 * Bypasses the queryParser/mapper to avoid query operator bugs.
 */
export async function executeRawQuery(
	model: Model,
	cql: string,
	params: any[] = [],
	options: { executionProfile?: string } = {},
) {
	const client = (model as any).client
	if (!client?.driver) {
		throw new Error(
			`Model "${(model as any).name}" has no scylla client available`,
		)
	}

	const result = await client.driver.execute(cql, params, {
		prepare: true,
		...options,
	})

	return result.rows || []
}

/**
 * Build and execute a SELECT query from structured conditions.
 * Supports: $gt, $gte, $lt, $lte, $in, $eq (default)
 */
export async function rawFind(
	model: Model,
	conditions: Record<string, any>,
	options: RawQueryOptions = {},
) {
	const schema = (model as any).schema
	const tableName = schema.table_name
	const client = (model as any).client
	const keyspace = client?.driver?.keyspace || client?.config?.keyspace
	const fullTableName = keyspace ? `${keyspace}.${tableName}` : tableName

	const whereClauses: string[] = []
	const params: any[] = []

	for (const [field, condition] of Object.entries(conditions)) {
		if (
			condition !== null &&
			typeof condition === "object" &&
			!Array.isArray(condition) &&
			!(condition instanceof Date)
		) {
			// operator-style: { $gt: value }, { $in: [...] }, etc.
			for (const [op, value] of Object.entries(
				condition as Record<string, any>,
			)) {
				switch (op) {
					case "$gt":
						whereClauses.push(`"${field}" > ?`)
						params.push(value)
						break
					case "$gte":
						whereClauses.push(`"${field}" >= ?`)
						params.push(value)
						break
					case "$lt":
						whereClauses.push(`"${field}" < ?`)
						params.push(value)
						break
					case "$lte":
						whereClauses.push(`"${field}" <= ?`)
						params.push(value)
						break
					case "$in":
						if (!Array.isArray(value))
							throw new Error("$in requires an array")
						if (value.length === 0) {
							// empty $in returns no results
							return []
						}
						const placeholders = value.map(() => "?").join(", ")
						whereClauses.push(`"${field}" IN (${placeholders})`)
						params.push(...value)
						break
					default:
						throw new Error(`Unsupported operator: ${op}`)
				}
			}
		} else {
			// simple equality
			whereClauses.push(`"${field}" = ?`)
			params.push(condition)
		}
	}

	let cql = `SELECT * FROM ${fullTableName}`

	if (whereClauses.length > 0) {
		cql += ` WHERE ${whereClauses.join(" AND ")}`
	}

	if (options.orderBy) {
		const orderParts = Object.entries(options.orderBy).map(
			([col, dir]) => `"${col}" ${dir}`,
		)
		cql += ` ORDER BY ${orderParts.join(", ")}`
	}

	if (options.limit) {
		cql += ` LIMIT ${options.limit}`
	}

	const rows = await executeRawQuery(model, cql, params)

	if (options.raw !== false) {
		return rows
	}

	// wrap results in Document objects
	return rows.map((row: any) => (model as any)._wrap(row))
}

/**
 * Like rawFind but returns a single result or null.
 */
export async function rawFindOne(
	model: Model,
	conditions: Record<string, any>,
	options: Omit<RawQueryOptions, "limit"> & {
		orderBy?: Record<string, "ASC" | "DESC">
	} = {},
) {
	const results = await rawFind(model, conditions, { ...options, limit: 1 })
	return results.length > 0 ? results[0] : null
}

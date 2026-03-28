import ScyllaDriver from "."
import fillDefaults from "./fillDefaults"
import queryParser from "./queryParser"
import { Result } from "./result"
import typeChecker from "./typeChecker"

import { mapping } from "cassandra-driver/lib/mapping"

export type ModelDescription = {
	key: string[]
	clustering_order: Record<string, any>
	table_name: string
	fields: any
	options: any
}

export type QueryOptions = {
	raw: Boolean
}

export class Model {
	constructor(
		driver: ScyllaDriver,
		name: string,
		description: ModelDescription,
	) {
		this.driver = driver
		this.name = name
		this.description = description

		if (!Array.isArray(this.description.key)) {
			throw new Error(`[${this.name}] model has missing "key" array`)
		}
		if (!this.description.table_name) {
			throw new Error(`[${this.name}] model has missing "table_name"`)
		}

		this.mapper = driver.mapper.forModel(this.name)
	}

	driver: ScyllaDriver
	mapper: mapping.ModelMapper

	name: string
	description: ModelDescription

	obj = (data: any) => {
		return this._wrap(data)
	}

	find = async (query: any, options: QueryOptions) => {
		const { $limit, ...rest } = query

		query = this._queryParser(rest)

		const docInfo: mapping.FindDocInfo = {}

		if ($limit !== undefined) {
			if (typeof $limit !== "number" || $limit <= 0) {
				throw new Error(
					`[ORM] El operador $limit debe ser un número mayor a 0.`,
				)
			}

			docInfo.limit = $limit
		}

		const result = await this.mapper.find(query, docInfo)

		if (options?.raw === true) {
			return result.toArray()
		}

		return result.toArray().map((row) => this._wrap(row))
	}

	findOne = async (query: any, options: QueryOptions) => {
		query = this._queryParser(query)

		let result = await this.mapper.get(query)

		if (!result) {
			return null
		}

		result = this._wrap(result)

		if (options?.raw === true) {
			return result.toRaw()
		}

		return result
	}

	update = async (query: any) => {
		query = this._fillDefaults(query)
		this._typeCheck(query)

		if (typeof query.__v !== "undefined") {
			if (Number.isNaN(query.__v)) {
				query.__v = 0
			} else {
				query.__v = query.__v + 1
			}
		}

		await this.mapper.update(query)
		return this._wrap(query)
	}

	delete = async (query: any) => {
		return await this.mapper.remove(query)
	}

	countAll = async (timeoutMs: number = 60000) => {
		let cql = `SELECT COUNT(1) FROM ${this.driver.config.keyspace}.${this.description.table_name}`

		const queryOptions = {
			prepare: true,
			readTimeout: timeoutMs,
		}

		try {
			const result = await this.driver.client.execute(
				cql,
				[],
				queryOptions,
			)

			return result.rows[0].count.toNumber()
		} catch (error) {
			throw error
		}
	}

	_wrap(row: any) {
		if (!row) {
			return null
		}

		row = this._fillDefaults(row)

		return new Result(row, this)
	}

	_typeCheck = typeChecker.bind(this)
	_fillDefaults = fillDefaults.bind(this)
	_queryParser = queryParser.bind(this)
}

export default Model

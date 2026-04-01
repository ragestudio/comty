import ScyllaClient from "."
import { Result } from "./result"

import fillDefaults from "./fillDefaults"
import queryParser, {
	_isValidFieldName,
	_isValidOperator,
	_validateElementType,
} from "./queryParser"
import typeChecker from "./typeChecker"

import { mapping } from "cassandra-driver/lib/mapping"
import type { ModelDescription, QueryOptions } from "./types"

export class Model {
	constructor(
		driver: ScyllaClient,
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
		if (
			!this.description.fields ||
			typeof this.description.fields !== "object"
		) {
			throw new Error(
				`[${this.name}] model has missing or invalid "fields"`,
			)
		}

		this.mapper = driver.mapper.forModel(this.name)
	}

	driver: ScyllaClient
	mapper: mapping.ModelMapper

	name: string
	description: ModelDescription

	obj = (data: any) => this._wrap(data)

	find = async (query: any, options: QueryOptions) => {
		const { $limit, ...rest } = query

		query = this._queryParser(rest)

		const docInfo: mapping.FindDocInfo = {}

		if ($limit !== undefined) {
			if (typeof $limit !== "number" || $limit <= 0) {
				throw new TypeError(
					`{$limit} operator must be a number greater than 0`,
				)
			}

			docInfo.limit = $limit
		}

		const operation = async () => {
			const result = await this.mapper.find(query, docInfo)
			const rows = result.toArray()

			if (options?.raw === true) {
				return rows
			}

			return rows.map((row) => this._wrap(row))
		}

		return this.driver.executeWithRetry(operation, `find on ${this.name}`)
	}

	findOne = async (query: any, options: QueryOptions) => {
		query = this._queryParser(query)

		const operation = async () => {
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

		return this.driver.executeWithRetry(
			operation,
			`findOne on ${this.name}`,
		)
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

		const operation = async () => {
			await this.mapper.update(query)
			return this._wrap(query)
		}

		return this.driver.executeWithRetry(operation, `update on ${this.name}`)
	}

	delete = async (query: any) => {
		const operation = async () => {
			return await this.mapper.remove(query)
		}

		return this.driver.executeWithRetry(operation, `delete on ${this.name}`)
	}

	countAll = async (timeoutMs: number = 60000) => {
		const cql = `SELECT COUNT(1) FROM ${this.driver.config.keyspace}.${this.description.table_name}`

		const queryOptions = {
			prepare: true,
			readTimeout: timeoutMs,
		}

		const operation = async () => {
			const result = await this.driver.client.execute(
				cql,
				[],
				queryOptions,
			)

			return result.rows[0].count.toNumber()
		}

		return this.driver.executeWithRetry(
			operation,
			`countAll on ${this.name}`,
		)
	}

	_wrap(row: any) {
		if (!row) {
			return null
		}

		row = this._fillDefaults(row)

		return new Result(row, this)
	}

	async _saveResult(result: Result) {
		if (!(result instanceof Result)) {
			throw new Error("result must be a instanceof Result")
		}

		const rawData = result.toRaw()

		this._typeCheck(rawData)

		// TODO: check if is any change & if is necessary to update

		return await this.update(rawData)
	}

	async _deleteResult(result: Result) {
		if (!(result instanceof Result)) {
			throw new Error("result must be a instanceof Result")
		}

		this.delete(result.toRaw())
	}

	_typeCheck = typeChecker.bind(this)
	_fillDefaults = fillDefaults.bind(this)
	_queryParser = queryParser.bind(this)
	_isValidFieldName = _isValidFieldName.bind(this)
	_isValidOperator = _isValidOperator.bind(this)
	_validateElementType = _validateElementType.bind(this)
}

export default Model

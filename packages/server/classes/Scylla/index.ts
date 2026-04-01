//@ts-ignore
import path from "node:path"
//@ts-ignore
import Cassandra from "cassandra-driver"
import loadModels from "./utils/loadModels"
import buildMapper from "./utils/buildMapper"

import type {
	Client as T_CassandraClient,
	ClientOptions as T_CassandraClientOptions,
	mapping as T_CassandraMapping,
} from "cassandra-driver"
import type { ClientConfig, ModelDescription } from "./types"

import { Model } from "./model"
import { Document } from "./document"
import { Result } from "./result"

const { SCYLLA_CONTACT_POINTS, SCYLLA_LOCAL_DATA_CENTER, SCYLLA_KEYSPACE } =
	process.env

const DEFAULT_MAX_RETRIES = 3
const DEFAULT_RETRY_DELAY = 1000

export default class ScyllaClient {
	constructor(config: ClientConfig = {}) {
		this.config = {
			modelsPath: path.resolve(__dirname, "../../scylla_models"),
			contactPoints: SCYLLA_CONTACT_POINTS
				? SCYLLA_CONTACT_POINTS.split(",")
				: ["127.0.0.1"],
			localDataCenter: SCYLLA_LOCAL_DATA_CENTER ?? "datacenter1",
			keyspace: SCYLLA_KEYSPACE ?? "comty",
			port: 9042,
			maxRetries: DEFAULT_MAX_RETRIES,
			retryDelay: DEFAULT_RETRY_DELAY,
			...config,
		}

		const clientOptions: T_CassandraClientOptions = {
			contactPoints: this.config.contactPoints,
			localDataCenter: this.config.localDataCenter,
			keyspace: this.config.keyspace,
			protocolOptions: {
				port: this.config.port,
			},
		}

		if (this.config.pooling) {
			clientOptions.pooling = this.config.pooling
		}

		this.client = new Cassandra.Client(clientOptions)
	}

	config: ClientConfig
	client: T_CassandraClient
	mapper: T_CassandraMapping.Mapper
	models: Map<string, Model> = new Map()

	model = (name: string) => {
		return this.models.get(name)
	}

	async initialize() {
		let models: any

		try {
			models = await loadModels(this.config.modelsPath)
		} catch (error) {
			throw new Error(`Failed to load models: ${error.message}`)
		}

		this.mapper = new Cassandra.mapping.Mapper(this.client, {
			models: buildMapper(models),
		})

		for (let [name, description] of Object.entries(models)) {
			this.models.set(
				name,
				new Model(this, name, description as ModelDescription),
			)
		}

		console.log("Connecting to ScyllaDB")

		await this.connectWithRetry()

		console.log("ScyllaDB Connected")
	}

	private async connectWithRetry(): Promise<void> {
		let lastError: Error | null = null

		for (let attempt = 1; attempt <= this.config.maxRetries!; attempt++) {
			try {
				await this.client.connect()
				return
			} catch (error) {
				lastError = error
				console.warn(
					`Connection attempt ${attempt} failed: ${error.message}`,
				)

				if (attempt < this.config.maxRetries!) {
					console.log(`Retrying in ${this.config.retryDelay}ms...`)
					await this.delay(this.config.retryDelay!)
				}
			}
		}

		throw new Error(
			`Failed to connect to ScyllaDB after ${this.config.maxRetries} attempts: ${lastError?.message}`,
		)
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms))
	}

	async shutdown(): Promise<void> {
		try {
			await this.client.shutdown()
			console.log("ScyllaDB connection closed")
		} catch (error) {
			console.error("Error shutting down ScyllaDB connection:", error)
			throw error
		}
	}

	async executeWithRetry<T>(
		operation: () => Promise<T>,
		operationName: string = "operation",
	): Promise<T> {
		let lastError: Error | null = null

		for (let attempt = 1; attempt <= this.config.maxRetries!; attempt++) {
			try {
				return await operation()
			} catch (error) {
				lastError = error

				// check if error is retryable
				if (
					this.isRetryableError(error) &&
					attempt < this.config.maxRetries!
				) {
					console.warn(
						`Operation ${operationName} attempt ${attempt} failed: ${error.message}`,
					)
					console.log(`Retrying in ${this.config.retryDelay}ms...`)

					await this.delay(this.config.retryDelay!)
					continue
				}

				// if not retryable or last attempt, throw
				throw error
			}
		}

		throw new Error(
			`Operation ${operationName} failed after ${this.config.maxRetries} attempts: ${lastError?.message}`,
		)
	}

	private isRetryableError(error: any): boolean {
		// retry on network errors, timeouts, and certain ScyllaDB errors
		const retryableMessages = [
			"timeout",
			"connection",
			"network",
			"unavailable",
			"overloaded",
			"no hosts available",
		]

		const errorMessage = error.message?.toLowerCase() || ""

		return retryableMessages.some((msg) => errorMessage.includes(msg))
	}
}

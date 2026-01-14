import fs from "node:fs"
import path from "node:path"

import ExpressCassandra from "express-cassandra"

const { SCYLLA_CONTACT_POINTS, SCYLLA_LOCAL_DATA_CENTER, SCYLLA_KEYSPACE } =
	process.env

export default class ScyllaDb {
	constructor(config = {}) {
		this.config = {
			modelsPath: path.resolve(__dirname, "../../scylla_db_models"),
			contactPoints: SCYLLA_CONTACT_POINTS
				? SCYLLA_CONTACT_POINTS.split(",")
				: ["127.0.0.1"],
			localDataCenter: SCYLLA_LOCAL_DATA_CENTER ?? "datacenter1",
			keyspace: SCYLLA_KEYSPACE ?? "comty",
			port: 9042,
			...config,
		}
	}

	client = null

	async initialize() {
		this.client = ExpressCassandra.createClient({
			clientOptions: {
				contactPoints: this.config.contactPoints,
				localDataCenter: this.config.localDataCenter,
				protocolOptions: { port: this.config.port, version: 4 },
				keyspace: this.config.keyspace,
				queryOptions: {
					consistency: ExpressCassandra.consistencies.one,
				},
				socketOptions: { readTimeout: 60000 },
			},
			ormOptions: {
				defaultReplicationStrategy: {
					class: "SimpleStrategy",
					replication_factor: 1,
				},
				migration: "alter",
			},
		})

		await this.loadModels()

		console.log("ScyllaDB client initialized")
	}

	async loadModels() {
		let modelFiles = await fs.promises.readdir(this.config.modelsPath)

		modelFiles = modelFiles.filter((file) => file.endsWith(".js"))

		for await (const file of modelFiles) {
			const modelName = file.replace(".js", "")
			const modelPath = path.join(this.config.modelsPath, file)

			try {
				let modelModule = await import(modelPath)

				modelModule = modelModule.default

				this.client.loadSchema(modelName, modelModule)

				await this.client.instance[modelName].syncDBAsync()
			} catch (error) {
				console.error(`Failed to load model [${modelName}]:`)
				throw error
			}
		}
	}

	model(name) {
		return this.client.instance[name]
	}
}

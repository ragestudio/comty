//@ts-ignore
import path from "node:path"
//@ts-ignore
import Cassandra from "cassandra-driver"

import type { Client as T_CassandraClient, mapping } from "cassandra-driver"

import loadModels from "./utils/loadModels"
import buildMapper from "./utils/buildMapper"
import Model, { ModelDescription } from "./model"

const { SCYLLA_CONTACT_POINTS, SCYLLA_LOCAL_DATA_CENTER, SCYLLA_KEYSPACE } =
	process.env

type Config = {
	modelsPath?: string
	contactPoints?: string[]
	localDataCenter?: string
	keyspace?: string
	port?: number
}

export default class ScyllaDriver {
	constructor(config: Config = {}) {
		this.config = {
			modelsPath: path.resolve(__dirname, "../../scylla_models"),
			contactPoints: SCYLLA_CONTACT_POINTS
				? SCYLLA_CONTACT_POINTS.split(",")
				: ["127.0.0.1"],
			localDataCenter: SCYLLA_LOCAL_DATA_CENTER ?? "datacenter1",
			keyspace: SCYLLA_KEYSPACE ?? "comty",
			port: 9042,
			...config,
		}

		this.client = new Cassandra.Client({
			contactPoints: this.config.contactPoints,
			localDataCenter: this.config.localDataCenter,
			keyspace: this.config.keyspace,
			protocolOptions: {
				port: this.config.port,
			},
		})
	}

	config: Config
	client: T_CassandraClient
	mapper: mapping.Mapper
	models: Map<string, Model> = new Map()

	model = (name: string) => {
		return this.models.get(name)
	}

	async initialize() {
		let models = await loadModels(this.config.modelsPath)

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
		await this.client.connect()
		console.log("SyllaDB Connected")
	}
}

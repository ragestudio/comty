import { Server } from "linebridge"

import ScyllaDb from "@ragestudio/scylla-odm"
import DbManager from "@shared-classes/DbManager"
import RedisClient from "@shared-classes/RedisClient"
import CacheService from "@shared-classes/CacheService"
import LimitsClass, { LimitsValues } from "@shared-classes/Limits"
import TaskQueueManager from "@shared-classes/TaskQueueManager"
import { S3Manager } from "@shared-classes/StorageClient"
import { Multipart } from "@shared-classes/Multipart"

import Capabilities from "@classes/Capabilities"

import SharedMiddlewares from "@shared-middlewares"
import path from "node:path"

export class API extends Server {
	static refName = "files"
	static listenPort = 3002

	static bypassCors = true
	static useMiddlewares = ["logs"]

	static websockets = {
		enabled: true,
		path: "/files",
	}

	middlewares = {
		...SharedMiddlewares,
	}

	contexts = {
		db: new DbManager(),
		scylla: new ScyllaDb({
			modelsPath: path.resolve(global["paths"].root, "../shared/db"),
		}),
		redis: RedisClient({
			maxRetriesPerRequest: null,
		}),
		cache: new CacheService(),
		limits: {} as LimitsValues,
		capabilities: new Capabilities(),
		multipartUpload: null as Multipart,
		s3: new S3Manager(),
		tasker: new TaskQueueManager({
			workersPath: `${__dirname}/queues`,
		}),
	}

	initialize = [
		() => this.contexts.capabilities.initialize(),
		() => this.contexts.db.initialize(),
		() =>
			this.contexts.scylla.initialize({
				sync: true,
			}),
		() => this.contexts.redis.initialize(),
		() =>
			this.contexts.tasker.initialize({
				redisOptions: this.contexts.redis.client,
			}),
	]

	async onInitialize() {
		this.contexts.limits = await LimitsClass.getAll()

		if (process.env.OVH_S3_KEY_ID && process.env.OVH_S3_SECRET_KEY) {
			await this.contexts.s3.addService("ovh", {
				cdnUrl: process.env.OVH_S3_CDN,
				endPoint: process.env.OVH_S3_ENDPOINT,
				defaultBucket: process.env.OVH_S3_BUCKET,
				accessKey: process.env.OVH_S3_KEY_ID,
				secretKey: process.env.OVH_S3_SECRET_KEY,
				port: 443,
				useSSL: true,
				setupBucket: false,
				pathStyle: false,
			})
		}

		if (process.env.B2_KEY_ID && process.env.B2_APP_KEY) {
			await this.contexts.s3.addService("b2", {
				endPoint: process.env.B2_ENDPOINT,
				cdnUrl: process.env.B2_CDN_ENDPOINT,
				accessKey: process.env.B2_KEY_ID,
				secretKey: process.env.B2_APP_KEY,
				defaultBucket: process.env.B2_BUCKET,
				port: 443,
				useSSL: true,
				setupBucket: false,
			})
		}

		this.contexts.multipartUpload = new Multipart(
			this.contexts.s3.getDefaultService(),
			this.contexts.limits,
		)

		global.storages = this.contexts.s3

		console.log({
			capabilities: this.contexts.capabilities,
			limits: this.contexts.limits,
		})
	}
}

Boot(API)

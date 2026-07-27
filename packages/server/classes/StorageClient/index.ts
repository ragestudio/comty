import path from "node:path"
import { Client } from "minio"
import { AwsClient } from "aws4fetch"

export type createClientOptions = {
	endPoint: string
	port: number
	useSSL?: boolean
	accessKey: string
	secretKey: string
	defaultBucket?: string
	defaultRegion?: string
	[key: string]: any
}

export const generateDefaultBucketPolicy = (payload) => {
	const { bucketName } = payload

	if (!bucketName) {
		throw new Error("bucketName is required")
	}

	return {
		Version: "2012-10-17",
		Statement: [
			{
				Action: ["s3:GetObject"],
				Effect: "Allow",
				Principal: {
					AWS: ["*"],
				},
				Resource: [`arn:aws:s3:::${bucketName}/*`],
				Sid: "",
			},
		],
	}
}

export class StorageClient extends Client {
	awsClient: AwsClient | undefined
	defaultBucket: string
	defaultRegion: string
	setupBucket: boolean
	cdnUrl: string | undefined

	constructor(options: createClientOptions) {
		super(options)

		this.defaultBucket = String(options.defaultBucket)
		this.defaultRegion = String(options.defaultRegion) ?? "s3"
		this.setupBucket = Boolean(options.setupBucket)
		this.cdnUrl = options.cdnUrl
		this.pathStyle = Boolean(options.pathStyle ?? true)

		this.awsClient = new AwsClient({
			accessKeyId: String(options.accessKey),
			secretAccessKey: String(options.secretKey),
			region: this.defaultRegion,
			service: "s3",
		})
	}

	composeRemoteURL = (key: string, extraKey?: string) => {
		let _path = path.join(this.defaultBucket, key)

		if (!this.pathStyle) {
			_path = key
		}

		if (typeof extraKey === "string") {
			_path = path.join(_path, extraKey)
		}

		if (this.cdnUrl) {
			return `${this.cdnUrl}/${_path}`
		}

		return `${this.protocol}//${this.host}:${this.port}/${_path}`
	}

	setDefaultBucketPolicy = async (bucketName: string) => {
		const policy = generateDefaultBucketPolicy({ bucketName })

		return this.setBucketPolicy(bucketName, JSON.stringify(policy))
	}

	initialize = async () => {
		console.log("🔌 Checking if storage client have default bucket...")

		if (this.setupBucket !== false) {
			try {
				const bucketExists = await this.bucketExists(this.defaultBucket)

				if (!bucketExists) {
					console.warn(
						"🪣 Default bucket not exists! Creating new bucket...",
					)

					await this.makeBucket(this.defaultBucket, "s3")

					// set default bucket policy
					await this.setDefaultBucketPolicy(this.defaultBucket)
				}
			} catch (error) {
				console.error(
					`Failed to check if default bucket exists or create default bucket >`,
					error,
				)
			}

			try {
				// check if default bucket policy exists
				const bucketPolicy = await this.getBucketPolicy(
					this.defaultBucket,
				).catch(() => {
					return null
				})

				if (!bucketPolicy) {
					// set default bucket policy
					await this.setDefaultBucketPolicy(this.defaultBucket)
				}
			} catch (error) {
				console.error(
					`Failed to get or set default bucket policy >`,
					error,
				)
			}
		}

		console.log("✅ Storage client is ready.")
	}
}

export class S3Manager {
	private defaultService: string = null
	services: Map<string, StorageClient> = new Map()

	setDefaultService(level: string) {
		if (!this.services.get(level)) {
			throw new Error("Level not exist")
		}

		this.defaultService = level
	}

	getDefaultService() {
		return this.services.get(this.defaultService)
	}

	getService(level: string) {
		return this.services.get(level)
	}

	async addService(level: string, options?: createClientOptions) {
		console.debug(`[S3] Adding new level (${level})`)

		if (this.services.size === 0) {
			console.debug(`[S3] Setting level (${level}) as default`)
			this.defaultService = level
		}

		const client = new StorageClient(options)
		await client.initialize()

		this.services.set(level, client)

		return client
	}
}

export const createStorageClientInstance = (options?: createClientOptions) => {
	return new StorageClient({
		endPoint: process.env.S3_ENDPOINT,
		port: Number(process.env.S3_PORT),
		useSSL: ToBoolean(process.env.S3_USE_SSL),
		accessKey: process.env.S3_ACCESS_KEY,
		secretKey: process.env.S3_SECRET_KEY,
		defaultBucket: process.env.S3_BUCKET,
		defaultRegion: process.env.S3_REGION,
		...options,
	})
}

export default createStorageClientInstance

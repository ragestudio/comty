const Minio = require("minio")
import path from "path"

export const generateDefaultBucketPolicy = (payload) => {
    const { bucketName } = payload

    if (!bucketName) {
        throw new Error("bucketName is required")
    }

    return {
        Version: "2012-10-17",
        Statement: [
            {
                Action: [
                    "s3:GetObject"
                ],
                Effect: "Allow",
                Principal: {
                    AWS: [
                        "*"
                    ]
                },
                Resource: [
                    `arn:aws:s3:::${bucketName}/*`
                ],
                Sid: ""
            }
        ]
    }
}

export class StorageClient extends Minio.Client {
    constructor(options) {
        super(options)

        this.defaultBucket = String(options.defaultBucket)
        this.defaultRegion = String(options.defaultRegion)
    }

    composeRemoteURL = (key) => {
        const _path = path.join(this.defaultBucket, key)

        return `${this.protocol}//${this.host}:${this.port}/${_path}`
    }

    setDefaultBucketPolicy = async (bucketName) => {
        const policy = generateDefaultBucketPolicy({ bucketName })

        return this.setBucketPolicy(bucketName, JSON.stringify(policy))
    }

    initialize = async () => {
        console.log("🔌 Checking if storage client have default bucket...")

        // check connection with s3
        const bucketExists = await this.bucketExists(this.defaultBucket).catch(() => {
            return false
        })

        if (!bucketExists) {
            console.warn("🪣 Default bucket not exists! Creating new bucket...")

            await this.makeBucket(this.defaultBucket, "s3")

            // set default bucket policy
            await this.setDefaultBucketPolicy(this.defaultBucket)
        }

        // check if default bucket policy exists
        const bucketPolicy = await this.getBucketPolicy(this.defaultBucket).catch(() => {
            return null
        })

        if (!bucketPolicy) {
            // set default bucket policy
            await this.setDefaultBucketPolicy(this.defaultBucket)
        }

        console.log("✅ Storage client is ready.")
    }
}

export const createStorageClientInstance = (options) => {
    return new StorageClient({
        ...options,
        endPoint: process.env.S3_ENDPOINT,
        port: Number(process.env.S3_PORT),
        useSSL: toBoolean(process.env.S3_USE_SSL),
        accessKey: process.env.S3_ACCESS_KEY,
        secretKey: process.env.S3_SECRET_KEY,
        defaultBucket: process.env.S3_BUCKET,
        defaultRegion: process.env.S3_REGION,
    })
}

export default createStorageClientInstance
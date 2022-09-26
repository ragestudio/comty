const Minio = require("minio")

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
        return `${this.protocol}//${this.host}:${this.port}/${this.defaultBucket}/${key}`
    }

    setDefaultBucketPolicy = async (bucketName) => {
        const policy = generateDefaultBucketPolicy({ bucketName })

        return this.setBucketPolicy(bucketName, JSON.stringify(policy))
    }

    initialize = async () => {
        // check connection with s3
        const bucketExists = await this.bucketExists(this.defaultBucket).catch(() => {
            return false
        })

        if (!bucketExists) {
            console.warn("Default bucket not exists! Creating new bucket...")

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
    }
}

export const createStorageClientInstance = (options) => {
    return new StorageClient({
        ...options,
        endPoint: process.env.s3_endpoint,
        port: Number(process.env.s3_port),
        useSSL: toBoolean(process.env.s3_use_ssl),
        accessKey: process.env.s3_access_key,
        secretKey: process.env.s3_secret_key,
        defaultBucket: process.env.s3_bucket_name,
        defaultRegion: process.env.s3_region,
    })
}

export default createStorageClientInstance
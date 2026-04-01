export type ClientConfig = {
	modelsPath?: string
	contactPoints?: string[]
	localDataCenter?: string
	keyspace?: string
	port?: number
	maxRetries?: number
	retryDelay?: number
	pooling?: {
		coreConnectionsPerHost?: Record<string, number>
		maxRequestsPerConnection?: number
	}
}

export type ModelDescription = {
	key: string[]
	clustering_order: Record<string, any>
	table_name: string
	fields: any
	options: any
}

export type QueryOptions = {
	raw?: Boolean
}

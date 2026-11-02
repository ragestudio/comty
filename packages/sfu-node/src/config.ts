import type {
	TransportListenInfo,
	WorkerLogLevel,
	WorkerLogTag,
} from "mediasoup/types"

import os from "node:os"

import { Worker as SnowflakeWorker } from "./classes/Snowflake"
import { resolvePublicIP } from "./utils/resolvePublicIp"

export const DEFAULT_KV_BUCKET = "sfu_nodes"

const DEFAULT_LOG_TAGS: WorkerLogTag[] = [
	"info",
	"ice",
	"dtls",
	"rtp",
	"srtp",
	"rtcp",
	"rtx",
	"bwe",
	"score",
	"simulcast",
	"svc",
]

export interface SfuNatsConfig {
	url: string
	address: string
	port: number
	user?: string
	pass?: string
	token?: string
	name?: string
}

export interface SfuConfig {
	nodeId: bigint
	refName: string
	hostname: string
	nats: SfuNatsConfig
	rtc: {
		port: number
		enableUdp: boolean
		enableTcp: boolean
		preferUdp: boolean
	}
	worker: {
		logLevel: WorkerLogLevel
		logTags: WorkerLogTag[]
	}
	kvBucket: string
	announcedIp?: string
	listens: TransportListenInfo[]
}

function parseNatsUrl(raw: string) {
	const value = raw.includes("://") ? raw : `nats://${raw}`
	const url = new URL(value)

	return {
		url: `nats://${url.hostname}:${url.port || 4222}`,
		address: url.hostname,
		port: Number(url.port || 4222),
		user: url.username ? decodeURIComponent(url.username) : undefined,
		pass: url.password ? decodeURIComponent(url.password) : undefined,
	}
}

function parseLogTags(value?: string): WorkerLogTag[] {
	if (!value) return DEFAULT_LOG_TAGS

	return value
		.split(",")
		.map((tag) => tag.trim())
		.filter(Boolean) as WorkerLogTag[]
}

export function loadSfuConfig(): SfuConfig {
	const nodeId = process.env.SFU_NODE_ID
		? BigInt(process.env.SFU_NODE_ID)
		: new SnowflakeWorker().nextId()

	const refName = process.env.SFU_NODE_REF ?? `sfu-${nodeId}`

	const natsUrl =
		process.env.NATS_URL ?? process.env.NATS_ADDRESS ?? "127.0.0.1:4222"

	const parsedNats = parseNatsUrl(natsUrl)

	const nats = {
		...parsedNats,
		user: process.env.NATS_USER ?? parsedNats.user,
		pass: process.env.NATS_PASS ?? parsedNats.pass,
		token: process.env.NATS_TOKEN,
		name: process.env.NATS_NAME ?? refName,
	}

	return {
		nodeId,
		refName,
		hostname: os.hostname(),
		nats,
		rtc: {
			port: Number(process.env.RTC_PORT ?? 40001),
			enableUdp: process.env.RTC_ENABLE_UDP !== "false",
			enableTcp: process.env.RTC_ENABLE_TCP !== "false",
			preferUdp: process.env.RTC_PREFER_UDP !== "false",
		},
		worker: {
			logLevel: (process.env.WORKER_LOG_LEVEL ?? "warn") as WorkerLogLevel,
			logTags: parseLogTags(process.env.WORKER_LOG_TAGS),
		},
		kvBucket: process.env.SFU_NODES_KV_BUCKET ?? DEFAULT_KV_BUCKET,
		announcedIp: process.env.ANNOUNCED_IP,
		listens: [],
	}
}

export async function resolveAnnouncedIp(config: SfuConfig): Promise<string> {
	if (!config.announcedIp) {
		config.announcedIp = await resolvePublicIP()
	}

	return config.announcedIp
}

export function buildListens(config: SfuConfig): TransportListenInfo[] {
	config.listens = [
		{
			protocol: "udp",
			ip: "0.0.0.0",
			announcedIp: config.announcedIp,
			port: config.rtc.port,
		},
		{
			protocol: "tcp",
			ip: "0.0.0.0",
			announcedIp: config.announcedIp,
			port: config.rtc.port,
		},
	]

	return config.listens
}

export function buildAppData(config: SfuConfig) {
	return {
		node_id: config.nodeId.toString(),
		hostname: config.hostname,
	}
}

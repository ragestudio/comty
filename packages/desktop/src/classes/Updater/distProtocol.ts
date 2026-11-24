import { createReadStream } from "node:fs"
import fs from "node:fs/promises"
import path from "node:path"
import { Readable } from "node:stream"

import { net, protocol } from "electron"
import mime from "mime"

const DIST_HOST = "comty.app"

/**
 * Requests that must always reach the real server even when a local dist is
 * active (API calls, websockets, etc).
 */
const FORWARDED_PREFIXES = ["/api", "/ws", "/socket.io", "/manifest.json"]

function isInside(root: string, candidate: string): boolean {
	const base = root.endsWith(path.sep) ? root : `${root}${path.sep}`

	return candidate === root || candidate.startsWith(base)
}

function textResponse(message: string, status: number): Response {
	return new Response(message, {
		status,
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
			"Cache-Control": "no-store",
		},
	})
}

async function statOrNull(filePath: string) {
	try {
		return await fs.stat(filePath)
	} catch {
		return null
	}
}

function shouldForwardToNetwork(pathname: string): boolean {
	return FORWARDED_PREFIXES.some(
		(prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
	)
}

function parseRange(
	header: string | null,
	size: number,
): { start: number; end: number } | null {
	if (!header || size <= 0) return null

	const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim())

	if (!match) return null

	const [, startRaw, endRaw] = match

	if (!startRaw && !endRaw) return null

	let start: number
	let end: number

	if (!startRaw) {
		const suffixLength = Number(endRaw)

		if (!Number.isFinite(suffixLength) || suffixLength <= 0) return null

		start = Math.max(size - suffixLength, 0)
		end = size - 1
	} else {
		start = Number(startRaw)
		end = endRaw ? Number(endRaw) : size - 1

		if (
			!Number.isFinite(start) ||
			!Number.isFinite(end) ||
			start > end ||
			start >= size
		) {
			return null
		}

		end = Math.min(end, size - 1)
	}

	return { start, end }
}

function createFileResponse(
	filePath: string,
	size: number,
	request: Request,
): Response {
	const headers = new Headers({
		"Content-Type": mime.getType(filePath) ?? "application/octet-stream",
		"Accept-Ranges": "bytes",
		"Cache-Control": "no-cache",
		"X-Content-Type-Options": "nosniff",
	})

	if (request.method === "HEAD") {
		headers.set("Content-Length", String(size))

		return new Response(null, { status: 200, headers })
	}

	const range = parseRange(request.headers.get("range"), size)

	if (range) {
		const stream = createReadStream(filePath, {
			start: range.start,
			end: range.end,
		})

		headers.set("Content-Length", String(range.end - range.start + 1))
		headers.set("Content-Range", `bytes ${range.start}-${range.end}/${size}`)

		return new Response(Readable.toWeb(stream) as unknown as ReadableStream, {
			status: 206,
			headers,
		})
	}

	headers.set("Content-Length", String(size))

	return new Response(
		Readable.toWeb(createReadStream(filePath)) as unknown as ReadableStream,
		{ status: 200, headers },
	)
}

async function serveDistFile(
	root: string,
	url: URL,
	request: Request,
): Promise<Response> {
	let relativePath: string

	try {
		relativePath = decodeURIComponent(url.pathname)
	} catch {
		return textResponse("Bad request", 400)
	}

	relativePath = relativePath.replace(/^\/+/, "")

	if (!relativePath) relativePath = "index.html"

	const rootPath = path.resolve(root)
	let filePath = path.resolve(rootPath, relativePath)

	if (!isInside(rootPath, filePath)) {
		return textResponse("Forbidden", 403)
	}

	let stats = await statOrNull(filePath)

	if (stats?.isDirectory()) {
		filePath = path.join(filePath, "index.html")
		stats = await statOrNull(filePath)
	}

	if (!stats?.isFile()) {
		const acceptsHtml = (request.headers.get("accept") ?? "").includes(
			"text/html",
		)
		const isDocument = request.destination === "document" || acceptsHtml

		// SPA fallback for client side routes, never for assets or data requests
		if (isDocument) {
			filePath = path.join(rootPath, "index.html")
			stats = await statOrNull(filePath)
		}
	}

	if (!stats?.isFile()) {
		return textResponse("Not found", 404)
	}

	return createFileResponse(filePath, stats.size, request)
}

/**
 * Serves the local dist through the real `https://comty.app` origin. This keeps
 * cookies, localStorage and IndexedDB intact across remote/local transitions.
 *
 * When no dist root is available (or the request is not for the app shell) the
 * request is forwarded to the network stack untouched.
 */
export function registerDistProtocol(getDistRoot: () => string | null): void {
	protocol.handle("https", async (request) => {
		const url = new URL(request.url)
		const distRoot = getDistRoot()

		const shouldServeLocally =
			!!distRoot &&
			url.hostname === DIST_HOST &&
			(request.method === "GET" || request.method === "HEAD") &&
			!shouldForwardToNetwork(url.pathname)

		if (!shouldServeLocally) {
			return net.fetch(request, {
				bypassCustomProtocolHandlers: true,
			})
		}

		return await serveDistFile(distRoot as string, url, request)
	})
}

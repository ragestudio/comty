interface RequestLike {
	headers: Record<string, any>
}

function firstHeaderValue(value: unknown): string | undefined {
	if (typeof value === "string") {
		return value.split(",")[0].trim()
	}

	if (Array.isArray(value) && value.length > 0) {
		return String(value[0]).trim()
	}

	return undefined
}

/**
 * Resolves the public request origin, taking reverse proxies into account.
 */
export default function getRequestOrigin(req: RequestLike): string {
	const protocol =
		firstHeaderValue(req.headers["x-forwarded-proto"]) || "https"
	const host =
		firstHeaderValue(req.headers["x-forwarded-host"]) ||
		firstHeaderValue(req.headers.host)

	if (!host) {
		throw new Error("Missing request host header")
	}

	return `${protocol}://${host}`
}

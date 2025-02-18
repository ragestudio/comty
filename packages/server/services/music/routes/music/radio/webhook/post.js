import { RadioProfile } from "@db_models"

function parseBasicAuth(auth) {
	if (!auth || typeof auth !== "string") {
		throw new Error("No or wrong argument")
	}

	var result = {},
		parts,
		decoded,
		colon

	parts = auth.split(" ")

	result.scheme = parts[0]
	if (result.scheme !== "Basic") {
		return result
	}

	decoded = new Buffer(parts[1], "base64").toString("utf8")
	colon = decoded.indexOf(":")

	result.username = decoded.substr(0, colon)
	result.password = decoded.substr(colon + 1)

	return result
}

export default async (req) => {
	if (!req.headers["authorization"]) {
		throw new OperationError(401, "Missing authorization header")
	}

	if (!req.headers["authorization"].startsWith("Basic")) {
		throw new OperationError(401, "Invalid authorization type. Use Basic.")
	}

	const auth = parseBasicAuth(req.headers["authorization"])

	const profile = await RadioProfile.find({
		_id: auth.username,
	}).select("+token")

	if (!profile) {
		throw new OperationError(404, "Profile with this token not exist")
	}

	if (profile.token !== auth.token) {
		throw new OperationError(401, "Token missmatch")
	}

	let data = {
		radio_id: auth.username,
		listeners: req.body.listeners.total,
		station_id: req.body.station.id,
		name: req.body.station.name,
		hls_src: req.body.station.hls_url,
		http_src: req.body.station.listen_url,
		now_playing: req.body.now_playing,
		online: ToBoolean(req.body.is_online),
		background: profile.background,
	}

	const redis_id = `radio-${data.radio_id}`

	const existMember = await global.websocket.redis.hexists(
		redis_id,
		"radio_id",
	)

	if (data.online) {
		await global.websocket.redis.hset(redis_id, {
			...data,
			now_playing: JSON.stringify(data.now_playing),
		})
	}

	if (!data.online && existMember) {
		await global.websocket.redis.hdel(redis_id)
	}

	console.log(`Updating Radio`, data, {
		redis_id,
		online: data.online,
		existMember,
	})

	global.sse.sendToChannel(`radio:${data.radio_id}`, {
		event: "update",
		data: data,
	})
	global.websocket.io.to(`radio:${data.radio_id}`).emit(`update`, data)

	return data
}

export default () => {
	const turnServers = []

	// Primary TURN server
	if (
		globalThis.process.env.TURN_SERVER_URL &&
		globalThis.process.env.TURN_SERVER_USERNAME &&
		globalThis.process.env.TURN_SERVER_PASSWORD
	) {
		turnServers.push({
			urls: globalThis.process.env.TURN_SERVER_URL,
			username: globalThis.process.env.TURN_SERVER_USERNAME,
			credential: globalThis.process.env.TURN_SERVER_PASSWORD,
		})
	}

	// TCP TURN server
	if (
		globalThis.process.env.TURN_SERVER_TCP_URL &&
		globalThis.process.env.TURN_SERVER_USERNAME &&
		globalThis.process.env.TURN_SERVER_PASSWORD
	) {
		turnServers.push({
			urls: globalThis.process.env.TURN_SERVER_TCP_URL,
			username: globalThis.process.env.TURN_SERVER_USERNAME,
			credential: globalThis.process.env.TURN_SERVER_PASSWORD,
		})
	}

	// Development fallback
	if (
		globalThis.process.env.NODE_ENV === "development" &&
		turnServers.length === 0
	) {
		turnServers.push({
			urls: "turn:a.relay.metered.ca:80",
			username: "openrelayproject",
			credential: "openrelayproject",
		})
	}

	return turnServers
}

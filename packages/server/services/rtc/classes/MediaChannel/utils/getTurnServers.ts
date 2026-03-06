function getTurnServers() {
	const turnServers = []

	// Primary TURN server
	if (
		(globalThis as any).process.env.TURN_SERVER_URL &&
		(globalThis as any).process.env.TURN_SERVER_USERNAME &&
		(globalThis as any).process.env.TURN_SERVER_PASSWORD
	) {
		turnServers.push({
			urls: (globalThis as any).process.env.TURN_SERVER_URL,
			username: (globalThis as any).process.env.TURN_SERVER_USERNAME,
			credential: (globalThis as any).process.env.TURN_SERVER_PASSWORD,
		})
	}

	// TCP TURN server
	if (
		(globalThis as any).process.env.TURN_SERVER_TCP_URL &&
		(globalThis as any).process.env.TURN_SERVER_USERNAME &&
		(globalThis as any).process.env.TURN_SERVER_PASSWORD
	) {
		turnServers.push({
			urls: (globalThis as any).process.env.TURN_SERVER_TCP_URL,
			username: (globalThis as any).process.env.TURN_SERVER_USERNAME,
			credential: (globalThis as any).process.env.TURN_SERVER_PASSWORD,
		})
	}

	// Development fallback
	if (
		(globalThis as any).process.env.NODE_ENV === "development" &&
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

export default getTurnServers

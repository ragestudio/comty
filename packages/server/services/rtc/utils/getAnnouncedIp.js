export default () => {
	let announcedIp = process.env.MEDIASOUP_ANNOUNCED_IP

	if (!announcedIp) {
		announcedIp =
			process.env.NODE_ENV === "production"
				? clientIp || "127.0.0.1"
				: "127.0.0.1"
	}

	return announcedIp
}

export const formatBytes = (bytes, decimals = 2) => {
	if (
		bytes === undefined ||
		bytes === null ||
		isNaN(parseFloat(bytes)) ||
		!isFinite(bytes)
	)
		return "0 Bytes"
	if (bytes === 0) {
		return "0 Bytes"
	}

	const k = 1024
	const dm = decimals < 0 ? 0 : decimals
	const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]

	const i = Math.floor(Math.log(bytes) / Math.log(k))

	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

export const formatBitrate = (bytesPerSecond) => {
	if (typeof bytesPerSecond !== "number" || isNaN(bytesPerSecond)) {
		return "0 Kbps"
	}

	const bitsPerSecond = bytesPerSecond * 8

	if (bitsPerSecond >= 1000000) {
		return `${(bitsPerSecond / 1000000).toFixed(1)} Mbps`
	}

	if (bitsPerSecond >= 1000 || bitsPerSecond === 0) {
		return `${(bitsPerSecond / 1000).toFixed(0)} Kbps`
	}

	return `${bitsPerSecond.toFixed(0)} bps`
}

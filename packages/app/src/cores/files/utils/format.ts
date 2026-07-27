export function formatSpeed(bytesPerSec: number): string {
	if (bytesPerSec === 0) {
		return "0 B/s"
	}

	const k = 1024
	const sizes = ["B/s", "KB/s", "MB/s", "GB/s"]
	const i = Math.floor(Math.log(bytesPerSec) / Math.log(k))

	return `${parseFloat((bytesPerSec / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

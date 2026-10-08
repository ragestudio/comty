export function volumeToGain(volume: number, min: number): number {
	const position = Math.max(0, Math.min(100, volume)) / 100

	if (position <= 0) return 0

	return Math.pow(10, (min * (1 - position)) / 20)
}

export default volumeToGain

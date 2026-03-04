export default (list, time) => {
	let left = 0
	let right = list.length - 1

	while (left <= right) {
		const mid = (left + right) >> 1
		const item = list[mid]

		const start = item.startTimeMs ?? item.start_ms
		const end = item.endTimeMs ?? item.end_ms

		if (time >= start && time <= end) return mid
		if (time < start) right = mid - 1
		else left = mid + 1
	}

	return -1
}

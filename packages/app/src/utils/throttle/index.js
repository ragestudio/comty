const throttle = (fn) => {
	let token = null
	let lastArgs = null

	const invoke = () => {
		fn(...lastArgs)
		token = null
	}

	const result = (...args) => {
		lastArgs = args

		if (!token) {
			token = requestAnimationFrame(invoke)
		}
	}

	result.cancel = () => token && cancelAnimationFrame(token)

	return result
}

export default throttle

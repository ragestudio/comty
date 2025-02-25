export default (email) => {
	const checkIfIsEmail = (email) => {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
	}

	return checkIfIsEmail(email)
}

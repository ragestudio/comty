export default (parent, element) => {
	if (!parent || !element) {
		return false
	}

	const parentRect = parent.getBoundingClientRect()
	const elementRect = element.getBoundingClientRect()

	return elementRect.width > parentRect.width
}

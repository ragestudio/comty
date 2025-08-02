export default (set, discriminator) => {
	for (const item of set) {
		if (discriminator(item)) {
			return item
		}
	}
}

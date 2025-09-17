const updateElementTransform = (elem, modifier, value) => {
	const currentTransform = elem.style.transform || ""

	const modifierRegex = new RegExp(`${modifier}\\([^)]*\\)`)
	const updatedModifier = `${modifier}(${value})`

	if (modifierRegex.test(currentTransform)) {
		elem.style.transform = currentTransform.replace(
			modifierRegex,
			updatedModifier,
		)
	} else {
		elem.style.transform = currentTransform
			? `${currentTransform} ${updatedModifier}`
			: updatedModifier
	}
}

export default updateElementTransform

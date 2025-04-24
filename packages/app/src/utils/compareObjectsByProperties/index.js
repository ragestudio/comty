export default function compareObjectsByProperties(obj1, obj2, props) {
	// validate that obj1 and obj2 are objects
	if (
		!obj1 ||
		!obj2 ||
		typeof obj1 !== "object" ||
		typeof obj2 !== "object"
	) {
		return false
	}

	// validate that props is an array
	if (!Array.isArray(props)) {
		throw new Error("The props parameter must be an array")
	}

	// iterate through each property and compare
	for (const prop of props) {
		// check if the property exists in both objects
		const prop1Exists = prop in obj1
		const prop2Exists = prop in obj2

		// if the property doesnt exist in one of the objects
		if (prop1Exists !== prop2Exists) {
			return false
		}

		// if the property exists in both, compare values
		if (prop1Exists && prop2Exists) {
			// for nested objects, perform deep comparison
			if (
				typeof obj1[prop] === "object" &&
				obj1[prop] !== null &&
				typeof obj2[prop] === "object" &&
				obj2[prop] !== null
			) {
				// compare arrays
				if (Array.isArray(obj1[prop]) && Array.isArray(obj2[prop])) {
					if (obj1[prop].length !== obj2[prop].length) {
						return false
					}

					for (let i = 0; i < obj1[prop].length; i++) {
						// if elements are objects, call recursively
						if (
							typeof obj1[prop][i] === "object" &&
							typeof obj2[prop][i] === "object"
						) {
							// get all properties of the object
							const nestedProps = [
								...new Set([
									...Object.keys(obj1[prop][i]),
									...Object.keys(obj2[prop][i]),
								]),
							]

							if (
								!compareObjectsByProperties(
									obj1[prop][i],
									obj2[prop][i],
									nestedProps,
								)
							) {
								return false
							}
						} else if (obj1[prop][i] !== obj2[prop][i]) {
							return false
						}
					}
				}
				// compare objects
				else {
					const nestedProps = [
						...new Set([
							...Object.keys(obj1[prop]),
							...Object.keys(obj2[prop]),
						]),
					]

					if (
						!compareObjectsByProperties(
							obj1[prop],
							obj2[prop],
							nestedProps,
						)
					) {
						return false
					}
				}
			}
			// for primitive values, compare directly
			else if (obj1[prop] !== obj2[prop]) {
				return false
			}
		}
	}

	return true
}

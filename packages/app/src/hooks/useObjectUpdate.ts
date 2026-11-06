import React from "react"
import lodash from "lodash"

export function useObjectUpdate<T extends object>(initialState: T) {
	const [current, setCurrent] = React.useState<T>(initialState)
	const [baseline, setBaseline] = React.useState<T>(initialState)

	// resync when the external data changes, keeping local edits on top
	React.useEffect(() => {
		if (lodash.isEqual(baseline, initialState)) {
			return
		}

		setCurrent((prev) => {
			if (!prev) {
				return initialState
			}

			const merged = { ...initialState }

			for (const key of Object.keys(prev) as (keyof T)[]) {
				if (!lodash.isEqual(prev[key], baseline[key])) {
					merged[key] = prev[key]
				}
			}

			return lodash.isEqual(merged, prev) ? prev : merged
		})

		setBaseline(initialState)
	}, [initialState, baseline])

	function updateProperty<KeyType extends keyof T>(
		key: KeyType,
		value: T[KeyType],
	) {
		setCurrent((prev) => {
			if (lodash.isEqual(prev[key], value)) {
				return prev
			}

			return {
				...prev,
				[key]: value,
			}
		})
	}

	function restore() {
		setCurrent(initialState)
	}

	const hasChanges = React.useMemo(
		() => !lodash.isEqual(current, baseline),
		[current, baseline],
	)

	return {
		current,
		setCurrent,
		updateProperty,
		hasChanges,
		restore,
	}
}

export default useObjectUpdate

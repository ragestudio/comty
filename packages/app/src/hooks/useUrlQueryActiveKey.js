import React from "react"

export function getCurrentKeyValue(queryKey) {
	if (app.isDesktop) {
		return history.state?.[queryKey] ?? null
	} else {
		return new URLSearchParams(window.location.search).get(queryKey)
	}
}

export default ({ defaultKey = "0", queryKey = "key" }) => {
	const [activeKey, setActiveKey] = React.useState(
		getCurrentKeyValue() ?? defaultKey,
	)

	const replaceQueryTypeToCurrentTab = (key) => {
		if (app.isDesktop) {
			if (!key) {
				// unset query
				return history.pushState({ [queryKey]: null })
			}

			return history.pushState({ [queryKey]: key })
		}

		if (!key) {
			// delete query
			return history.pushState(undefined, "", window.location.pathname)
		}

		return history.pushState(undefined, "", `?${queryKey}=${key}`)
	}

	const changeActiveKey = (key) => {
		setActiveKey(key)
		replaceQueryTypeToCurrentTab(key)
	}

	const onHistoryChange = () => {
		const newActiveKey = new URLSearchParams(window.location.search).get(
			queryKey,
		)

		setActiveKey(newActiveKey ?? defaultKey)
	}

	React.useEffect(() => {
		window.addEventListener("popstate", onHistoryChange)

		return () => {
			window.removeEventListener("popstate", onHistoryChange)
		}
	}, [])

	return [activeKey, changeActiveKey]
}

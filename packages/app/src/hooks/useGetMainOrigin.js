import React from "react"

const useGetMainOrigin = () => {
	const [mainOrigin, setMainOrigin] = React.useState(null)

	React.useEffect(() => {
		const instance = app.cores.api.client()

		if (instance) {
			setMainOrigin(instance.origin)
		}

		return () => {
			setMainOrigin(null)
		}
	}, [])

	return mainOrigin
}

export default useGetMainOrigin

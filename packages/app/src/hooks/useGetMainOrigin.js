import React from "react"
import client from "comty.js/core/client"

const useGetMainOrigin = () => {
	const [mainOrigin, setMainOrigin] = React.useState(null)

	React.useEffect(() => {
		setMainOrigin(client.origin)

		return () => {
			setMainOrigin(null)
		}
	}, [])

	return mainOrigin
}

export default useGetMainOrigin

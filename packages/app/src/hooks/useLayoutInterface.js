import React from "react"

const useLayoutInterface = (namespace, ctx) => {
	React.useEffect(() => {
		if (app.layout[namespace] === "object") {
			throw new Error(`Layout namespace [${namespace}] already exists`)
		}

		app.layout[namespace] = ctx
	}, [])

	return app.layout[namespace]
}

export default useLayoutInterface

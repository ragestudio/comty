import React from "react"

const getHandlerState = () => {
	return app.cores.mediartc.state()
}

export const useMediaRTCState = () => {
	const [state, setState] = React.useState(getHandlerState())

	const handleStateChange = React.useCallback(() => {
		setState(getHandlerState())
	}, [])

	React.useEffect(() => {
		app.eventBus.on("mediartc:state:change", handleStateChange)

		return () => {
			app.eventBus.off("mediartc:state:change", handleStateChange)
		}
	}, [handleStateChange])

	return {
		...state,
		speakingConsumers: new Set(state.speakingConsumers),
	}
}

export default useMediaRTCState

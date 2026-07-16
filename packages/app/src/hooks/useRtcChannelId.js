import React from "react"

const useRtcChannelId = () => {
	const [channelId, setChannelId] = React.useState(
		() => app.cores.mediartc.state().channelId,
	)

	React.useEffect(() => {
		const handler = () => {
			const newId = app.cores.mediartc.state().channelId
			setChannelId((prev) => (prev !== newId ? newId : prev))
		}
		app.eventBus.on("mediartc:state:change", handler)
		return () => app.eventBus.off("mediartc:state:change", handler)
	}, [])

	return channelId
}

export default useRtcChannelId

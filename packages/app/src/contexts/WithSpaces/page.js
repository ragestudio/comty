import React from "react"

const URL_PREFIX = "spaces"

const DEFAULT_CONTEXT_DATA = {
	firstLoad: true,
	type: null,
	room: null,
	channel: null,
	isVoice: null,
	setType: () => null,
	setRoom: () => null,
	setChannel: () => null,
	setIsVoice: () => null,
}

const context = React.createContext(DEFAULT_CONTEXT_DATA)

const composePathname = ({ type, room, channel, isVoice = false }) => {
	const parts = [URL_PREFIX, type, room, channel]

	if (isVoice) {
		parts.push("voice")
	}

	return "/" + parts.filter((part) => part).join("/")
}

const controller = () => {
	const [firstLoad, setFirstLoad] = React.useState(true)
	const [type, setType] = React.useState(null)
	const [room, setRoom] = React.useState(null)
	const [channel, setChannel] = React.useState(null)
	const [isVoice, setIsVoice] = React.useState(null)

	const updateToHistory = () => {
		const pathname = composePathname({
			type: type,
			room: room,
			channel: channel,
			isVoice: isVoice,
		})

		history.pushState(undefined, undefined, pathname)
	}

	const updateFromHistory = React.useCallback(() => {
		const parts = window.location.pathname.split("/")
		const [_, prefix, _type, _room, _channel, _voice] = parts

		if (prefix !== URL_PREFIX) {
			return null
		}

		if (_type !== type) {
			setType(_type || null)
		}

		if (_room !== room) {
			setRoom(_room || null)
		}

		if (_channel !== channel) {
			setChannel(_channel || null)
		}

		if (_voice === "voice") {
			setIsVoice(true)
		} else {
			setIsVoice(false)
		}
	}, [type, room, channel, isVoice, firstLoad])

	// listen to history changes
	React.useEffect(() => {
		updateFromHistory()
		setFirstLoad(false)

		window.addEventListener("popstate", updateFromHistory)

		return () => {
			window.removeEventListener("popstate", updateFromHistory)
		}
	}, [])

	React.useEffect(() => {
		if (!firstLoad) {
			updateToHistory()
		}
	}, [type, room, channel, isVoice, firstLoad])

	return {
		firstLoad: firstLoad,
		type: type,
		room: room,
		channel: channel,
		isVoice: isVoice,
		setType: setType,
		setRoom: setRoom,
		setChannel: setChannel,
		setIsVoice: setIsVoice,
	}
}

export { controller, context, DEFAULT_CONTEXT_DATA, URL_PREFIX }
export default context

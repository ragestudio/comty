import "./index.less"

const FloatingScreens = () => {
	const videoRef = React.useRef(null)
	const [stream, setStream] = React.useState(null)

	const onClickScreen = (screen) => {
		app.location.push(`/spaces/channel`)
	}

	React.useEffect(() => {
		if (app.cores.mediartc.instance().screens.size === 0) {
			return false
		}

		const firstScreen = app.cores.mediartc
			.instance()
			.screens.values()
			.next().value

		console.log({ firstScreen })

		if (firstScreen) {
			setStream(firstScreen.media)
			videoRef.current.srcObject = firstScreen.media
			videoRef.current.play()
		}
	}, [])

	return (
		<div
			className="floating-screens"
			onClick={onClickScreen}
		>
			<video ref={videoRef} />
		</div>
	)
}

export default FloatingScreens

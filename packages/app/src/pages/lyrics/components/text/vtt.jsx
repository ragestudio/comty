import VTTParser from "@classes/VTTParser"

const VTT = ({ lyrics }) => {
	const vttParser = React.useRef(new VTTParser())
	const [vttData, setVttData] = useState([])

	const onRenderTick = React.useCallback(() => {
		if (vttData) {
			const loc = vttParser.current.getLocationAtTime(
				app.cores.player.controls.seek(),
			)

			if (loc) {
				if (visibleTimeout.current) {
					clearTimeout(visibleTimeout.current)
				}

				setVisible(true)
				setCurrentLineIndex(loc.lineIndex)
				setCurrentWordIndex(loc.wordIndex)
			} else {
				if (!visibleTimeout.current) {
					visibleTimeout.current = setTimeout(() => {
						setVisible(false)
						visibleTimeout.current = null
					}, 1000)
				}
			}

			return
		}
	}, [vttData])

	return vttData.map((line, index) => {
		return (
			<div
				key={index}
				id={`lyrics-line-${index}`}
				className={classnames("line", "vtt", {
					["current"]: currentLineIndex === index,
				})}
				style={{
					display: "inline-flex",
					gap: "9px",
				}}
			>
				{line.words.map((item, wordIndex) => (
					<p
						key={wordIndex}
						className={classnames("line__word", {
							["current"]:
								currentWordIndex === wordIndex &&
								currentLineIndex === index,
						})}
					>
						{item.text}
					</p>
				))}
			</div>
		)
	})
}

export default VTT

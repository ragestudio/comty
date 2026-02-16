import React from "react"
import Button from "@ui/Button"

import { createIconRender } from "@components/Icons"

export default (props) => {
	const [mode, setMode] = React.useState(app.cores.player.playback.mode())

	const modeToIcon = {
		normal: "ArrowRight",
		repeat: "Repeat1",
		shuffle: "Shuffle",
	}

	const onClick = () => {
		const modes = Object.keys(modeToIcon)

		const newMode = modes[(modes.indexOf(mode) + 1) % modes.length]

		app.cores.player.playback.mode(newMode)

		setMode(newMode)
	}

	return (
		<Button
			type="ghost"
			icon={createIconRender(modeToIcon[mode])}
			disabled={props.disabled ?? false}
			onClick={onClick}
		/>
	)
}
